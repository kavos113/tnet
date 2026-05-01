import { randomUUID } from 'node:crypto';
import type {
  RequesterExtractionRule,
  RequesterExecutionResult,
  RequesterNetworkOptions,
  RequesterVariable,
  RequesterResponseSnapshot,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';
import { extractVariablesFromResponse } from '@tnet/app-requester/shared/responseExtraction';
import { interpolateRequesterRequest } from '@tnet/app-requester/shared/variableInterpolation';
import { serializeRequesterRequest } from '../http/requestSerializer';
import { parseRequesterStreamingResponse } from '../http/responseParser';
import { buildRequesterNetworkOptions } from './networkOptions';
import { redactRequesterRequest } from './redaction';

export interface RequesterTransport {
  fetch(
    url: string,
    init: RequestInit,
    networkOptions?: RequesterNetworkOptions
  ): Promise<Response>;
}

export interface RequesterExecutionProgress {
  status: number;
  byteSize: number;
  durationMs: number;
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

export interface RequesterVariableStore {
  listVariables(variableSetId: string): RequesterVariable[];
  upsertVariables(variableSetId: string, variables: Array<{ key: string; value: string }>): void;
}

const defaultTransport: RequesterTransport = {
  fetch: (url, init) => fetch(url, init)
};

export class RequestExecutionService {
  private readonly controllers = new Map<string, AbortController>();

  constructor(
    private readonly historyStore: RequesterHistoryStore,
    private readonly transport: RequesterTransport = defaultTransport,
    private readonly timeoutMs = 30000,
    private readonly cookieStore?: RequesterCookieStore,
    private readonly variableStore?: RequesterVariableStore,
    private readonly onProgress?: (progress: RequesterExecutionProgress) => void
  ) {}

  async send(request: SaveRequesterRequestInput): Promise<RequesterExecutionResult> {
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const interpolatedRequest = this.interpolateRequest(request);
    const requestWithCookies = await this.withCookieHeader(interpolatedRequest);
    const serialized = await serializeRequesterRequest(requestWithCookies);
    const controller = new AbortController();
    const executionId = request.executionId ?? randomUUID();
    this.controllers.set(executionId, controller);
    const timeout = setTimeout(() => controller.abort(), request.timeoutMs ?? this.timeoutMs);
    let response: Response;
    const networkOptions = buildRequesterNetworkOptions(request);
    try {
      response = await this.transport.fetch(
        serialized.url,
        {
          ...serialized.init,
          redirect: request.followRedirects === false ? 'manual' : 'follow',
          signal: controller.signal
        },
        networkOptions
      );
    } finally {
      clearTimeout(timeout);
      this.controllers.delete(executionId);
    }
    if (interpolatedRequest.cookieJarEnabled) {
      this.cookieStore?.saveFromResponse(
        interpolatedRequest.workspaceId,
        serialized.url,
        response.headers
      );
    }
    const snapshot = await parseRequesterStreamingResponse(
      response,
      () => Math.round(performance.now() - started),
      (progress) => this.onProgress?.(progress)
    );
    this.extractVariables(interpolatedRequest, snapshot);
    const historyId = this.historyStore.saveExecution({
      request: redactRequesterRequest(interpolatedRequest),
      response: snapshot,
      startedAt
    });

    return {
      response: snapshot,
      historyId
    };
  }

  abort(executionId: string): void {
    this.controllers.get(executionId)?.abort();
    this.controllers.delete(executionId);
  }

  private interpolateRequest(request: SaveRequesterRequestInput): SaveRequesterRequestInput {
    if (!request.variableSetId || !this.variableStore) return request;
    const variables = this.variableStore.listVariables(request.variableSetId);
    if (variables.length === 0) return request;
    return interpolateRequesterRequest(request, variables);
  }

  private extractVariables(
    request: SaveRequesterRequestInput,
    response: RequesterResponseSnapshot
  ): void {
    if (!request.variableSetId || !request.extractionRules?.length || !this.variableStore) return;
    const extracted = extractVariablesFromResponse(
      request.extractionRules as RequesterExtractionRule[],
      response
    );
    if (extracted.length === 0) return;
    this.variableStore.upsertVariables(request.variableSetId, extracted);
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
