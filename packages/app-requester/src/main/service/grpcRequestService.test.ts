// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { GrpcRequestService } from './grpcRequestService';

describe('GrpcRequestService', () => {
  it('builds proto-import unary call input', async () => {
    const client = {
      call: vi.fn().mockResolvedValue('{"ok":true}')
    };
    const service = new GrpcRequestService(client);

    await expect(
      service.unary({
        workspaceId: 'workspace-1',
        name: 'GetUser',
        method: 'POST',
        url: 'localhost:50051',
        grpcProtoPath: 'C:\\proto\\user.proto',
        grpcPackageName: 'users.v1',
        grpcServiceName: 'UserService',
        grpcMethodName: 'GetUser',
        grpcMetadata: [{ id: 'auth', enabled: true, key: 'authorization', value: 'Bearer token' }],
        bodyText: '{"id":"1"}'
      })
    ).resolves.toBe('{"ok":true}');

    expect(client.call).toHaveBeenCalledWith({
      protoPath: 'C:\\proto\\user.proto',
      packageName: 'users.v1',
      serviceName: 'UserService',
      methodName: 'GetUser',
      endpoint: 'localhost:50051',
      metadata: { authorization: 'Bearer token' },
      bodyText: '{"id":"1"}'
    });
  });
});
