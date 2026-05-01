// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { RequesterCookieStore, RequesterHistoryStore } from './requestExecutionService';
import { RequestExecutionService } from './requestExecutionService';

const createResponse = (body: string, init: ResponseInit): Response => new Response(body, init);

describe('RequestExecutionService', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('applies auth, query params, body, and stores history', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(
        createResponse('{"ok":true}', {
          status: 201,
          statusText: 'Created',
          headers: { 'content-type': 'application/json' }
        })
      )
    };
    const service = new RequestExecutionService(historyStore, transport);

    await expect(
      service.send({
        workspaceId: 'workspace-1',
        name: 'Create',
        method: 'POST',
        url: 'https://example.test/users',
        queryParams: [{ id: 'q', enabled: true, key: 'page', value: '1' }],
        headers: [{ id: 'h', enabled: true, key: 'X-Test', value: 'yes' }],
        bodyMode: 'json',
        bodyText: '{"name":"Ada"}',
        authType: 'bearer',
        authToken: 'token'
      })
    ).resolves.toMatchObject({
      historyId: 'history-1',
      response: {
        status: 201,
        statusText: 'Created',
        bodyText: '{"ok":true}',
        contentType: 'application/json'
      }
    });

    expect(transport.fetch).toHaveBeenCalledOnce();
    const [url, init] = transport.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/users?page=1');
    expect(init.method).toBe('POST');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer token');
    expect((init.headers as Headers).get('X-Test')).toBe('yes');
    expect(init.body).toBe('{"name":"Ada"}');
    expect(historyStore.saveExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          authToken: '********'
        })
      })
    );
  });

  it('passes execution options and aborts after the request timeout', async () => {
    vi.useFakeTimers();
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const transport = {
      fetch: vi.fn((_url: string, init: RequestInit) => {
        const signal = init.signal;
        return new Promise<Response>((resolve) => {
          signal?.addEventListener('abort', () => {
            resolve(createResponse('aborted', { status: 499, statusText: 'Client Closed' }));
          });
        });
      })
    };
    const service = new RequestExecutionService(historyStore, transport, 30000);

    const result = service.send({
      workspaceId: 'workspace-1',
      name: 'Slow',
      method: 'GET',
      url: 'https://example.test/slow',
      timeoutMs: 10,
      followRedirects: false
    });

    await vi.advanceTimersByTimeAsync(10);

    await expect(result).resolves.toMatchObject({
      response: {
        status: 499,
        bodyText: 'aborted'
      }
    });
    expect(transport.fetch).toHaveBeenCalledWith(
      'https://example.test/slow',
      expect.objectContaining({
        redirect: 'manual',
        signal: expect.any(AbortSignal)
      }),
      expect.objectContaining({
        validateTlsCertificates: true,
        proxy: expect.objectContaining({ mode: 'system' })
      })
    );
  });

  it('aborts an in-flight request by execution id', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const transport = {
      fetch: vi.fn((_url: string, init: RequestInit) => {
        return new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        });
      })
    };
    const service = new RequestExecutionService(historyStore, transport);

    const result = service.send({
      executionId: 'execution-1',
      workspaceId: 'workspace-1',
      name: 'Abort',
      method: 'GET',
      url: 'https://example.test/abort'
    });
    await vi.waitFor(() => expect(transport.fetch).toHaveBeenCalled());
    service.abort('execution-1');

    await expect(result).rejects.toThrow('aborted');
    expect(historyStore.saveExecution).not.toHaveBeenCalled();
  });

  it('passes proxy and TLS settings to the transport boundary', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(createResponse('ok', { status: 200 }))
    };
    const service = new RequestExecutionService(historyStore, transport);

    await service.send({
      workspaceId: 'workspace-1',
      name: 'Network',
      method: 'GET',
      url: 'https://example.test/api',
      validateTlsCertificates: false,
      proxyMode: 'http',
      proxyHost: 'proxy.test',
      proxyPort: 8080,
      proxyUsername: 'testuser',
      proxyPasswordSecretId: 'secret-proxy',
      clientCertificatePath: 'C:\\certs\\client.crt',
      clientCertificateKeyPath: 'C:\\certs\\client.key',
      clientCertificatePassphraseSecretId: 'secret-cert',
      customCaCertificatePath: 'C:\\certs\\ca.crt'
    });

    expect(transport.fetch).toHaveBeenCalledWith('https://example.test/api', expect.any(Object), {
      validateTlsCertificates: false,
      proxy: {
        mode: 'http',
        host: 'proxy.test',
        port: 8080,
        username: 'testuser',
        passwordSecretId: 'secret-proxy'
      },
      tls: {
        clientCertificatePath: 'C:\\certs\\client.crt',
        clientCertificateKeyPath: 'C:\\certs\\client.key',
        clientCertificatePassphraseSecretId: 'secret-cert',
        customCaCertificatePath: 'C:\\certs\\ca.crt'
      }
    });
  });

  it('uses the workspace cookie jar when enabled and stores response cookies', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const cookieStore: RequesterCookieStore = {
      getCookieHeader: vi.fn().mockReturnValue('session=abc'),
      saveFromResponse: vi.fn()
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(
        createResponse('ok', {
          status: 200,
          headers: {
            'set-cookie': 'theme=dark; Path=/'
          }
        })
      )
    };
    const service = new RequestExecutionService(historyStore, transport, 30000, cookieStore);

    await service.send({
      workspaceId: 'workspace-1',
      name: 'Cookie',
      method: 'GET',
      url: 'https://example.test/api',
      cookieJarEnabled: true
    });

    const [url, init] = transport.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/api');
    expect((init.headers as Headers).get('Cookie')).toBe('session=abc');
    expect(cookieStore.saveFromResponse).toHaveBeenCalledWith(
      'workspace-1',
      'https://example.test/api',
      expect.any(Headers)
    );
  });

  it('does not override an explicit Cookie header with the workspace cookie jar', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const cookieStore: RequesterCookieStore = {
      getCookieHeader: vi.fn().mockReturnValue('session=abc'),
      saveFromResponse: vi.fn()
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(createResponse('ok', { status: 200 }))
    };
    const service = new RequestExecutionService(historyStore, transport, 30000, cookieStore);

    await service.send({
      workspaceId: 'workspace-1',
      name: 'Cookie',
      method: 'GET',
      url: 'https://example.test/api',
      headers: [{ id: 'cookie', enabled: true, key: 'Cookie', value: 'manual=yes' }],
      cookieJarEnabled: true
    });

    const [, init] = transport.fetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Headers).get('Cookie')).toBe('manual=yes');
    expect(cookieStore.getCookieHeader).not.toHaveBeenCalled();
  });

  it('extracts variables from the response into the selected variable set', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const variableStore = {
      listVariables: vi.fn().mockReturnValue([]),
      upsertVariables: vi.fn()
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(
        createResponse('{"token":"abc"}', {
          status: 200,
          headers: {
            'x-request-id': 'req-1'
          }
        })
      )
    };
    const service = new RequestExecutionService(
      historyStore,
      transport,
      30000,
      undefined,
      variableStore
    );

    await service.send({
      workspaceId: 'workspace-1',
      name: 'Login',
      method: 'POST',
      url: 'https://example.test/login',
      variableSetId: 'variables-1',
      extractionRules: [
        {
          id: 'token',
          enabled: true,
          source: 'json-body',
          expression: '$.token',
          targetVariable: 'accessToken'
        },
        {
          id: 'request-id',
          enabled: true,
          source: 'header',
          expression: 'x-request-id',
          targetVariable: 'requestId'
        }
      ]
    });

    expect(variableStore.upsertVariables).toHaveBeenCalledWith('variables-1', [
      { key: 'accessToken', value: 'abc' },
      { key: 'requestId', value: 'req-1' }
    ]);
  });

  it('interpolates variables before serializing and sending the request', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-1')
    };
    const variableStore = {
      listVariables: vi.fn().mockReturnValue([
        {
          key: 'baseUrl',
          value: 'https://example.test',
          updatedAt: '2026-05-01T00:00:00.000Z'
        },
        {
          key: 'token',
          value: 'abc',
          updatedAt: '2026-05-01T00:00:00.000Z'
        }
      ]),
      upsertVariables: vi.fn()
    };
    const transport = {
      fetch: vi.fn().mockResolvedValue(createResponse('ok', { status: 200 }))
    };
    const service = new RequestExecutionService(
      historyStore,
      transport,
      30000,
      undefined,
      variableStore
    );

    await service.send({
      workspaceId: 'workspace-1',
      name: 'Variables',
      method: 'POST',
      url: '{{baseUrl}}/users',
      headers: [{ id: 'auth', enabled: true, key: 'Authorization', value: 'Bearer {{token}}' }],
      bodyMode: 'text',
      bodyText: '{{token}}',
      variableSetId: 'variables-1'
    });

    const [url, init] = transport.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://example.test/users');
    expect((init.headers as Headers).get('Authorization')).toBe('Bearer abc');
    expect(init.body).toBe('abc');
  });

  it('sends gRPC requests through the gRPC service and stores history', async () => {
    const historyStore: RequesterHistoryStore = {
      saveExecution: vi.fn().mockReturnValue('history-grpc')
    };
    const transport = {
      fetch: vi.fn()
    };
    const grpcRequestService = {
      unary: vi.fn().mockResolvedValue({
        status: 0,
        statusText: 'OK',
        headers: [{ id: 'grpc-status', enabled: true, key: 'grpc-status', value: '0' }],
        bodyText: '{\n  "ok": true\n}',
        bodyBase64: 'ewogICJvayI6IHRydWUKfQ==',
        contentType: 'application/grpc+json',
        byteSize: 16,
        durationMs: 8,
        isBodyTruncated: false,
        previewType: 'json'
      })
    };
    const service = new RequestExecutionService(
      historyStore,
      transport,
      30000,
      undefined,
      undefined,
      undefined,
      grpcRequestService
    );

    await expect(
      service.send({
        workspaceId: 'workspace-1',
        name: 'Check',
        requestType: 'grpc',
        method: 'POST',
        url: 'localhost:50051',
        grpcProtoPath: 'C:\\proto\\health.proto',
        grpcPackageName: 'health.v1',
        grpcServiceName: 'HealthService',
        grpcMethodName: 'Check',
        bodyText: '{}'
      })
    ).resolves.toMatchObject({
      historyId: 'history-grpc',
      response: {
        status: 0,
        statusText: 'OK',
        contentType: 'application/grpc+json'
      }
    });

    expect(transport.fetch).not.toHaveBeenCalled();
    expect(grpcRequestService.unary).toHaveBeenCalledWith(
      expect.objectContaining({
        requestType: 'grpc',
        grpcMethodName: 'Check'
      })
    );
    expect(historyStore.saveExecution).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({
          requestType: 'grpc',
          grpcProtoPath: 'C:\\proto\\health.proto'
        })
      })
    );
  });
});
