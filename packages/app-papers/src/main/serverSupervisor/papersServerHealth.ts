import * as grpc from '@grpc/grpc-js';
import {
  HealthServiceClient,
  type IHealthServiceClient
} from '@tnet/app-papers/main/generated/tnet/papers/v1/papers.grpc-client';
import type { CheckResponse } from '@tnet/app-papers/main/generated/tnet/papers/v1/papers';

export type PapersServerHealthClientFactory = (baseUrl: string) => IHealthServiceClient;
export type PapersServerHealthCheck = (baseUrl: string) => Promise<boolean>;

export const createPapersServerHealthClient = (baseUrl: string): HealthServiceClient =>
  new HealthServiceClient(toGrpcAddress(baseUrl), grpc.credentials.createInsecure());

export const checkPapersServerHealth = async (
  baseUrl: string,
  clientFactory: PapersServerHealthClientFactory = createPapersServerHealthClient
): Promise<boolean> => {
  const client = clientFactory(baseUrl);
  try {
    const response = await check(client);
    return response.status === 'ok';
  } catch {
    return false;
  } finally {
    closeClient(client);
  }
};

const check = (client: IHealthServiceClient): Promise<CheckResponse> =>
  new Promise((resolve, reject) => {
    client.check({}, (error, response) => {
      if (error) {
        reject(error);
        return;
      }
      if (!response) {
        reject(new Error('gRPC health response was empty'));
        return;
      }
      resolve(response);
    });
  });

const closeClient = (client: IHealthServiceClient): void => {
  if ('close' in client && typeof client.close === 'function') {
    client.close();
  }
};

const toGrpcAddress = (baseUrl: string): string => {
  if (!baseUrl.includes('://')) return baseUrl.replace(/\/+$/g, '');

  const url = new URL(baseUrl);
  return url.port ? `${url.hostname}:${url.port}` : url.hostname;
};
