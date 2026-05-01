import path from 'node:path';
import * as grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import type {
  RequesterKeyValueRow,
  RequesterResponseSnapshot,
  SaveRequesterRequestInput
} from '@tnet/app-requester/shared/requesterTypes';

export interface GrpcUnaryClient {
  call(input: {
    protoPath: string;
    packageName: string;
    serviceName: string;
    methodName: string;
    endpoint: string;
    metadata: Record<string, string>;
    bodyText: string;
  }): Promise<RequesterResponseSnapshot>;
}

export class GrpcRequestService {
  constructor(private readonly client: GrpcUnaryClient = new DynamicGrpcUnaryClient()) {}

  async unary(request: SaveRequesterRequestInput): Promise<RequesterResponseSnapshot> {
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

class DynamicGrpcUnaryClient implements GrpcUnaryClient {
  async call(input: {
    protoPath: string;
    packageName: string;
    serviceName: string;
    methodName: string;
    endpoint: string;
    metadata: Record<string, string>;
    bodyText: string;
  }): Promise<RequesterResponseSnapshot> {
    validateGrpcInput(input);
    const started = performance.now();
    const packageDefinition = await protoLoader.load(input.protoPath, {
      includeDirs: [path.dirname(input.protoPath)],
      keepCase: false,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    });
    const loadedPackage = grpc.loadPackageDefinition(packageDefinition);
    const serviceConstructor = resolveServiceConstructor(
      loadedPackage,
      input.packageName,
      input.serviceName
    );
    const endpoint = normalizeGrpcEndpoint(input.endpoint);
    const credentials = input.endpoint.trim().startsWith('grpcs://')
      ? grpc.credentials.createSsl()
      : grpc.credentials.createInsecure();
    const client = new serviceConstructor(endpoint, credentials) as grpc.Client & {
      [methodName: string]: unknown;
    };
    const method = client[input.methodName];
    if (typeof method !== 'function') {
      client.close();
      throw new Error(`gRPC method was not found: ${input.methodName}`);
    }

    try {
      return await unaryCall({
        bodyText: input.bodyText,
        durationMs: () => Math.round(performance.now() - started),
        metadata: input.metadata,
        method: method.bind(client) as GrpcUnaryMethod
      });
    } finally {
      client.close();
    }
  }
}

type GrpcUnaryMethod = (
  request: unknown,
  metadata: grpc.Metadata,
  callback: (error: grpc.ServiceError | null, response?: unknown) => void
) => grpc.ClientUnaryCall;

const validateGrpcInput = (input: {
  protoPath: string;
  packageName: string;
  serviceName: string;
  methodName: string;
  endpoint: string;
}): void => {
  if (!input.protoPath.trim()) throw new Error('gRPC proto file is required.');
  if (!input.packageName.trim()) throw new Error('gRPC package is required.');
  if (!input.serviceName.trim()) throw new Error('gRPC service is required.');
  if (!input.methodName.trim()) throw new Error('gRPC method is required.');
  if (!input.endpoint.trim()) throw new Error('gRPC endpoint is required.');
};

const resolveServiceConstructor = (
  loadedPackage: grpc.GrpcObject,
  packageName: string,
  serviceName: string
): grpc.ServiceClientConstructor => {
  let scope: grpc.GrpcObject | grpc.ServiceClientConstructor | undefined = loadedPackage;
  for (const segment of packageName.split('.').filter(Boolean)) {
    const next = (scope as grpc.GrpcObject)[segment];
    if (!next) throw new Error(`gRPC package was not found: ${packageName}`);
    scope = next;
  }
  const service = (scope as grpc.GrpcObject)[serviceName];
  if (typeof service !== 'function') {
    throw new Error(`gRPC service was not found: ${packageName}.${serviceName}`);
  }
  return service as grpc.ServiceClientConstructor;
};

const normalizeGrpcEndpoint = (endpoint: string): string => {
  const trimmed = endpoint.trim().replace(/\/+$/g, '');
  if (!trimmed.includes('://')) return trimmed;
  const url = new URL(trimmed);
  return url.port ? `${url.hostname}:${url.port}` : url.hostname;
};

const unaryCall = ({
  bodyText,
  durationMs,
  metadata,
  method
}: {
  bodyText: string;
  durationMs: () => number;
  metadata: Record<string, string>;
  method: GrpcUnaryMethod;
}): Promise<RequesterResponseSnapshot> =>
  new Promise((resolve, reject) => {
    const responseMetadata: RequesterKeyValueRow[] = [];
    const statusMetadata: RequesterKeyValueRow[] = [];
    let responseBodyText: string | undefined;
    let latestStatus: grpc.StatusObject | undefined;
    let settled = false;
    const settleSuccess = (status?: grpc.StatusObject, force = false): void => {
      if (settled || responseBodyText === undefined) return;
      if (!status && !force) return;
      settled = true;
      const statusCode = status?.code ?? grpc.status.OK;
      const statusText = grpc.status[statusCode] ?? 'UNKNOWN';
      resolve({
        status: statusCode,
        statusText,
        headers: [
          grpcHeader('content-type', 'application/grpc+json'),
          ...responseMetadata,
          ...statusMetadata
        ],
        bodyText: responseBodyText,
        bodyBase64: Buffer.from(responseBodyText, 'utf-8').toString('base64'),
        contentType: 'application/grpc+json',
        byteSize: Buffer.byteLength(responseBodyText),
        durationMs: durationMs(),
        isBodyTruncated: false,
        previewType: 'json'
      });
    };
    const call = method(parseGrpcBody(bodyText), toGrpcMetadata(metadata), (error, response) => {
      if (error) {
        settled = true;
        reject(error);
        return;
      }
      responseBodyText = JSON.stringify(response ?? null, null, 2);
      setImmediate(() => settleSuccess(latestStatus, true));
    });
    call.on('metadata', (metadata) =>
      responseMetadata.push(...metadataToRows(metadata, 'metadata'))
    );
    call.on('status', (status) => {
      latestStatus = status;
      statusMetadata.push(
        grpcHeader('grpc-status', String(status.code)),
        grpcHeader('grpc-status-text', grpc.status[status.code] ?? 'UNKNOWN')
      );
      if (status.details) statusMetadata.push(grpcHeader('grpc-message', status.details));
      statusMetadata.push(...metadataToRows(status.metadata, 'status-metadata'));
      settleSuccess(status);
    });
  });

const parseGrpcBody = (bodyText: string): unknown => {
  const trimmed = bodyText.trim();
  if (!trimmed) return {};
  try {
    return JSON.parse(trimmed);
  } catch {
    throw new Error('gRPC request body must be valid JSON.');
  }
};

const toGrpcMetadata = (values: Record<string, string>): grpc.Metadata => {
  const metadata = new grpc.Metadata();
  for (const [key, value] of Object.entries(values)) {
    metadata.set(key, value);
  }
  return metadata;
};

const metadataToRows = (metadata: grpc.Metadata, prefix: string): RequesterKeyValueRow[] =>
  Object.entries(metadata.getMap()).map(([key, value]) =>
    grpcHeader(
      `${prefix}:${key}`,
      Buffer.isBuffer(value) ? value.toString('base64') : String(value)
    )
  );

const grpcHeader = (key: string, value: string): RequesterKeyValueRow => ({
  id: key,
  enabled: true,
  key,
  value
});
