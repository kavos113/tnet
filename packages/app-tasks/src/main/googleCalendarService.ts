import fs from 'fs';
import { google, type calendar_v3 } from 'googleapis';
import type { CalendarSource } from '@tnet/app-tasks/shared/tasksTypes';
import type { CalendarSourceRepository } from './repository';
import type { TasksSecretStore } from './tasksSecretStore';

const googleCalendarScope = 'https://www.googleapis.com/auth/calendar.readonly';
const credentialsPathEnv = 'TNET_GOOGLE_CALENDAR_CREDENTIALS_PATH';

export type GoogleCalendarEvent = calendar_v3.Schema$Event;

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
    private readonly secretStore: TasksSecretStore
  ) {}

  createAuthUrl(sourceId: string): string {
    this.requireGoogleSource(sourceId);
    return createOAuthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [googleCalendarScope]
    });
  }

  async completeAuth(sourceId: string, code: string): Promise<CalendarSource> {
    const source = this.requireGoogleSource(sourceId);
    const client = createOAuthClient();
    const { tokens } = await client.getToken(code);
    const secretId = this.secretStore.replaceSecret(
      source.googleTokenSecretId,
      JSON.stringify(tokens)
    );
    return this.sourceRepository.save({
      ...source,
      googleTokenSecretId: secretId
    });
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
    const client = createOAuthClient();
    const tokenText = this.secretStore.getSecret(source.googleTokenSecretId);
    if (!tokenText) throw new Error('Google Calendar source is not authorized.');
    client.setCredentials(JSON.parse(tokenText));
    const calendar = google.calendar({ version: 'v3', auth: client });
    const result = await calendar.events.list({
      calendarId: source.uri || 'primary',
      timeMin,
      timeMax,
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
}

const createOAuthClient = () => {
  const credentials = loadGoogleDesktopCredentials();
  return new google.auth.OAuth2(
    credentials.clientId,
    credentials.clientSecret,
    credentials.redirectUri
  );
};

const loadGoogleDesktopCredentials = (): {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
} => {
  const credentialsPath = process.env[credentialsPathEnv];
  if (!credentialsPath) {
    throw new Error(`${credentialsPathEnv} is not set.`);
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
