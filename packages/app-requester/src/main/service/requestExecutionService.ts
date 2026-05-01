import type {
  RequesterExecutionResult,
  RequesterResponseSnapshot,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import { serializeRequesterRequest } from '../http/requestSerializer';
import { parseRequesterResponse } from '../http/responseParser';
import { redactRequesterRequest } from './redaction';

export interface RequesterTransport {
  fetch(url: string, init: RequestInit): Promise<Response>;
}

export interface RequesterHistoryStore {
  saveExecution(input: {
    request: SaveRequesterRequestInput;
    response: RequesterResponseSnapshot;
    startedAt: string;
  }): string | undefined;
}

export interface RequesterCookieStore {
  getCookieHeader(workspaceId: string, requestUrl: string): string | undefined;
  saveFromResponse(workspaceId: string, requestUrl: string, headers: Headers): void;
}

const defaultTransport: RequesterTransport = {
  fetch: (url, init) => fetch(url, init)
};

export class RequestExecutionService {
  constructor(
    private readonly historyStore: RequesterHistoryStore,
    private readonly transport: RequesterTransport = defaultTransport,
    private readonly timeoutMs = 30000,
    private readonly cookieStore?: RequesterCookieStore
  ) {}

  async send(request: SaveRequesterRequestInput): Promise<RequesterExecutionResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const requestWithCookies = await this.withCookieHeader(request);
    const serialized = await serializeRequesterRequest(requestWithCookies);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? this.timeoutMs);
    let response: Response;
    try {
      response = await this.transport.fetch(serialized.url, {
        ...serialized.init,
        redirect: request.followRedirects === false ? 'manual' : 'follow',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeout);
    }
    if (request.cookieJarEnabled) {
      this.cookieStore?.saveFromResponse(request.workspaceId, serialized.url, response.headers);
    }
    const snapshot = await parseRequesterResponse(
      response,
      Math.round(performance.now() - started)
    );
    const historyId = this.historyStore.saveExecution({
      request: redactRequesterRequest(request),
      response: snapshot,
      startedAt
    });

    return {
      response: snapshot,
      historyId
    };
  }

  private async withCookieHeader(
    request: SaveRequesterRequestInput
  ): Promise<SaveRequesterRequestInput> {
    if (!request.cookieJarEnabled || !this.cookieStore) return request;
    if (request.headers?.some((row) => row.enabled && row.key.trim().toLowerCase() === 'cookie')) {
      return request;
    }

    const cookieHeader = this.cookieStore.getCookieHeader(request.workspaceId, request.url);
    if (!cookieHeader) return request;

    return {
      ...request,
      headers: [
        ...(request.headers ?? []),
        {
          id: 'workspace-cookie-jar',
          enabled: true,
          key: 'Cookie',
          value: cookieHeader
        }
      ]
    };
  }
}
