// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { WebSocketRequestService } from './websocketRequestService';

describe('WebSocketRequestService', () => {
  it('connects with headers, sends message templates, and closes', async () => {
    const client = {
      send: vi.fn(),
      close: vi.fn()
    };
    const factory = {
      connect: vi.fn().mockResolvedValue(client)
    };
    const service = new WebSocketRequestService(factory);

    await service.run({
      workspaceId: 'workspace-1',
      name: 'Socket',
      method: 'GET',
      url: 'wss://example.test/socket',
      headers: [{ id: 'auth', enabled: true, key: 'Authorization', value: 'Bearer token' }],
      websocketMessages: ['hello', 'world']
    });

    expect(factory.connect).toHaveBeenCalledWith('wss://example.test/socket', {
      Authorization: 'Bearer token'
    });
    expect(client.send).toHaveBeenNthCalledWith(1, 'hello');
    expect(client.send).toHaveBeenNthCalledWith(2, 'world');
    expect(client.close).toHaveBeenCalledOnce();
  });
});
