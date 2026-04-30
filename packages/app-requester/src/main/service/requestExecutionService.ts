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

const defaultTransport: RequesterTransport = {
  fetch: (url, init) => fetch(url, init)
};

export class RequestExecutionService {
  constructor(
    private readonly historyStore: RequesterHistoryStore,
    private readonly transport: RequesterTransport = defaultTransport,
    private readonly timeoutMs = 30000
  ) {}

  async send(request: SaveRequesterRequestInput): Promise<RequesterExecutionResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const serialized = await serializeRequesterRequest(request);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const response = await this.transport.fetch(serialized.url, {
      ...serialized.init,
      signal: controller.signal
    });
    clearTimeout(timeout);
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
}
