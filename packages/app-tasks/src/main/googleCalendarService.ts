import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import { google, type calendar_v3 } from 'googleapis';
import type { CalendarSource } from '@tnet/app-tasks/shared/tasksTypes';
import type { CalendarSourceRepository } from './repository';
import type { TasksSecretStore } from './tasksSecretStore';

const googleCalendarScope = 'https://www.googleapis.com/auth/calendar.readonly';
const googleAuthTimeoutMs = 5 * 60 * 1000;

export type GoogleCalendarEvent = calendar_v3.Schema$Event;
export type OpenGoogleAuthUrl = (authUrl: string) => Promise<void> | void;

export interface GoogleCalendarServiceOptions {
  authTimeoutMs?: number;
  credentialsPath?: string;
  runtimeConfigPath?: string;
}

interface GoogleDesktopCredentials {
  installed?: {
    client_id?: string;
    client_secret?: string;
    redirect_uris?: string[];
  };
}

export class GoogleCalendarService {
  constructor(
    private readonly sourceRepository: CalendarSourceRepository,
    private readonly secretStore: TasksSecretStore,
    private readonly options: GoogleCalendarServiceOptions = {}
  ) {}

  createAuthUrl(sourceId: string): string {
    this.requireGoogleSource(sourceId);
    return createOAuthClient(this.options).generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [googleCalendarScope]
    });
  }

  async completeAuth(sourceId: string, code: string): Promise<CalendarSource> {
    const source = this.requireGoogleSource(sourceId);
    const client = createOAuthClient(this.options);
    const { tokens } = await client.getToken(code);
    return this.saveTokens(source, tokens);
  }

  async authorizeWithLocalCallback(
    sourceId: string,
    openAuthUrl: OpenGoogleAuthUrl
  ): Promise<CalendarSource> {
    const source = this.requireGoogleSource(sourceId);
    const credentials = loadGoogleDesktopCredentials(this.options);
    const state = crypto.randomBytes(32).toString('base64url');
    const callback = await createLoopbackCallbackServer(
      credentials.redirectUri,
      state,
      this.options.authTimeoutMs ?? googleAuthTimeoutMs
    );

    try {
      const client = createOAuthClient(this.options, callback.redirectUri);
      const codeVerifier = await client.generateCodeVerifierAsync();
      const authUrl = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        redirect_uri: callback.redirectUri,
        scope: [googleCalendarScope],
        state,
        code_challenge: codeVerifier.codeChallenge,
        code_challenge_method: 'S256' as never
      });
      await openAuthUrl(authUrl);
      const code = await callback.code;
      const { tokens } = await client.getToken({
        code,
        codeVerifier: codeVerifier.codeVerifier,
        redirect_uri: callback.redirectUri
      });
      return this.saveTokens(source, tokens);
    } finally {
      await callback.close();
    }
  }

  async listEvents({
    source,
    timeMin,
    timeMax
  }: {
    source: CalendarSource;
    timeMin: string;
    timeMax: string;
  }): Promise<GoogleCalendarEvent[]> {
    const client = createOAuthClient(this.options);
    const tokenText = this.secretStore.getSecret(source.googleTokenSecretId);
    if (!tokenText) throw new Error('Google Calendar source is not authorized.');
    client.setCredentials(JSON.parse(tokenText));
    const calendar = google.calendar({ version: 'v3', auth: client });
    const result = await calendar.events.list({
      calendarId: source.uri || 'primary',
      timeMin,
      timeMax,
      timeZone: 'Asia/Tokyo',
      singleEvents: true,
      orderBy: 'startTime'
    });
    return result.data.items ?? [];
  }

  private requireGoogleSource(sourceId: string): CalendarSource {
    const source = this.sourceRepository.get(sourceId);
    if (!source) throw new Error(`Calendar source not found: ${sourceId}`);
    if (source.type !== 'google-calendar') {
      throw new Error('Calendar source is not a Google Calendar source.');
    }
    return source;
  }

  private saveTokens(source: CalendarSource, tokens: object): CalendarSource {
    const tokenRecord = tokens as Record<string, unknown>;
    const existingTokenText = this.secretStore.getSecret(source.googleTokenSecretId);
    const existingTokens = existingTokenText
      ? (JSON.parse(existingTokenText) as Record<string, unknown>)
      : {};
    const mergedTokens = {
      ...existingTokens,
      ...tokenRecord,
      refresh_token: tokenRecord.refresh_token ?? existingTokens.refresh_token
    };
    const secretId = this.secretStore.replaceSecret(
      source.googleTokenSecretId,
      JSON.stringify(mergedTokens)
    );
    const saved = this.sourceRepository.save({
      ...source,
      googleTokenSecretId: secretId
    });
    return this.sourceRepository.clearSyncError(saved.id);
  }
}

const createOAuthClient = (options: GoogleCalendarServiceOptions, redirectUri?: string) => {
  const credentials = loadGoogleDesktopCredentials(options);
  return new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    redirectUri ?? credentials.redirectUri
  );
};

const loadGoogleDesktopCredentials = (
  options: GoogleCalendarServiceOptions
): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} => {
  const credentialsPath = options.credentialsPath;
  if (!credentialsPath) {
    throw new Error(
      `Google Calendar credentials path is not configured. Set googleCalendarCredentialsPath in ${
        options.runtimeConfigPath ?? 'the Tasks runtime config'
      }.`
    );
  }
  const credentials = JSON.parse(
    fs.readFileSync(credentialsPath, 'utf-8')
  ) as GoogleDesktopCredentials;
  const installed = credentials.installed;
  const clientId = installed?.client_id;
  const clientSecret = installed?.client_secret;
  const redirectUri = installed?.redirect_uris?.[0];
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Invalid Google Calendar OAuth desktop credentials.');
  }
  return {
    clientId,
    clientSecret,
    redirectUri
  };
};

const createLoopbackCallbackServer = async (
  baseRedirectUri: string,
  expectedState: string,
  timeoutMs: number
): Promise<{
  close: () => Promise<void>;
  code: Promise<string>;
  redirectUri: string;
}> => {
  const baseUrl = new URL(baseRedirectUri);
  if (baseUrl.protocol !== 'http:') {
    throw new Error('Google Calendar desktop OAuth redirect URI must use http.');
  }
  if (!isLoopbackHost(baseUrl.hostname)) {
    throw new Error('Google Calendar desktop OAuth redirect URI must use a loopback host.');
  }

  let resolveCode: (code: string) => void = () => undefined;
  let rejectCode: (error: Error) => void = () => undefined;
  let settled = false;
  const code = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });
  const timer = windowlessTimeout(() => {
    if (settled) return;
    settled = true;
    rejectCode(new Error('Timed out waiting for Google authorization callback.'));
  }, timeoutMs);

  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    if (normalizePath(requestUrl.pathname) !== normalizePath(baseUrl.pathname)) {
      writeCallbackResponse(response, 404, 'Google authorization callback path was not found.');
      return;
    }

    const error = requestUrl.searchParams.get('error');
    const state = requestUrl.searchParams.get('state');
    const authorizationCode = requestUrl.searchParams.get('code');
    if (state !== expectedState) {
      if (!settled) {
        settled = true;
        rejectCode(new Error('Google authorization state did not match.'));
      }
      writeCallbackResponse(response, 400, 'Google authorization failed: state did not match.');
      return;
    }
    if (error) {
      if (!settled) {
        settled = true;
        rejectCode(new Error(`Google authorization failed: ${error}`));
      }
      writeCallbackResponse(response, 400, `Google authorization failed: ${error}`);
      return;
    }
    if (!authorizationCode) {
      if (!settled) {
        settled = true;
        rejectCode(new Error('Google authorization callback did not include a code.'));
      }
      writeCallbackResponse(response, 400, 'Google authorization failed: code was missing.');
      return;
    }

    if (!settled) {
      settled = true;
      resolveCode(authorizationCode);
    }
    writeCallbackResponse(
      response,
      200,
      'Google Calendar authorization completed. You can close this tab.'
    );
  });

  const port = await listenOnLoopback(server, baseUrl.hostname);
  const redirectUrl = new URL(baseUrl.toString());
  redirectUrl.port = String(port);
  redirectUrl.search = '';
  redirectUrl.hash = '';

  return {
    close: async () =>
      new Promise((resolve, reject) => {
        clearTimeout(timer);
        server.close((error) => (error ? reject(error) : resolve()));
      }),
    code,
    redirectUri: redirectUrl.toString()
  };
};

const listenOnLoopback = async (server: http.Server, hostname: string): Promise<number> =>
  new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, hostname, () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Failed to start Google authorization callback server.'));
        return;
      }
      resolve(address.port);
    });
  });

const isLoopbackHost = (hostname: string): boolean =>
  hostname === 'localhost' ||
  hostname === '127.0.0.1' ||
  hostname === '::1' ||
  hostname === '[::1]';

const normalizePath = (pathname: string): string => pathname || '/';

const writeCallbackResponse = (
  response: http.ServerResponse,
  statusCode: number,
  message: string
): void => {
  response.writeHead(statusCode, { 'content-type': 'text/html; charset=utf-8' });
  response.end(`<!doctype html><html><body><p>${escapeHtml(message)}</p></body></html>`);
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const windowlessTimeout = (callback: () => void, timeoutMs: number): NodeJS.Timeout =>
  setTimeout(callback, timeoutMs);
