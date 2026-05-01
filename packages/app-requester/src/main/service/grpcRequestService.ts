import type { SaveRequesterRequestInput } from '@tnet/app-requester/shared/requesterTypes';

export interface GrpcUnaryClient {
  call(input: {
    protoPath: string;
    packageName: string;
    serviceName: string;
    methodName: string;
    endpoint: string;
    metadata: Record<string, string>;
    bodyText: string;
  }): Promise<string>;
}

export class GrpcRequestService {
  constructor(private readonly client: GrpcUnaryClient) {}

  async unary(request: SaveRequesterRequestInput): Promise<string> {
    return this.client.call({
      protoPath: request.grpcProtoPath ?? '',
      packageName: request.grpcPackageName ?? '',
      serviceName: request.grpcServiceName ?? '',
      methodName: request.grpcMethodName ?? '',
      endpoint: request.url,
      metadata: Object.fromEntries(
        (request.grpcMetadata ?? [])
          .filter((row) => row.enabled && row.key.trim())
          .map((row) => [row.key, row.value])
      ),
      bodyText: request.bodyText ?? ''
    });
  }
}
