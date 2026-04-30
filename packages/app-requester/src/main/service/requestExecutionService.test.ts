// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { RequesterHistoryStore } from './requestExecutionService';
import { RequestExecutionService } from './requestExecutionService';

const createResponse = (body: string, init: ResponseInit): Response => new Response(body, init);

describe('RequestExecutionService', () => {
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
});
