import type * as grpc from '@grpc/grpc-js';
import { describe, expect, it, vi } from 'vitest';
import type { IHealthServiceClient } from '@tnet/app-papers/main/generated/tnet/papers/v1/papers.grpc-client';
import { checkPapersServerHealth } from './papersServerHealth';

describe('checkPapersServerHealth', () => {
  it('returns health state from the generated gRPC health client', async () => {
    const testcases = [
      {
        name: 'healthy response',
        status: 'ok',
        want: true
      },
      {
        name: 'unhealthy status',
        status: 'starting',
        want: false
      }
    ];

    for (const testcase of testcases) {
      const close = vi.fn();
      const client = createHealthClientStub({
        check: (_request, callback) => {
          callback(null, { status: testcase.status, version: 'test' });
          return {} as grpc.ClientUnaryCall;
        },
        close
      });
      const clientFactory = vi.fn(() => client);

      await expect(checkPapersServerHealth('http://127.0.0.1:38911', clientFactory)).resolves.toBe(
        testcase.want
      );
      expect(clientFactory).toHaveBeenCalledWith('http://127.0.0.1:38911');
      expect(close, testcase.name).toHaveBeenCalledOnce();
    }
  });

  it('returns false when the gRPC server is unreachable', async () => {
    const client = createHealthClientStub({
      check: (_request, callback) => {
        callback({ message: 'ECONNREFUSED' } as grpc.ServiceError);
        return {} as grpc.ClientUnaryCall;
      }
    });

    await expect(checkPapersServerHealth('http://127.0.0.1:38911', () => client)).resolves.toBe(
      false
    );
  });

  it('returns false when the gRPC response is empty', async () => {
    const client = createHealthClientStub({
      check: (_request, callback) => {
        callback(null);
        return {} as grpc.ClientUnaryCall;
      }
    });

    await expect(checkPapersServerHealth('http://127.0.0.1:38911', () => client)).resolves.toBe(
      false
    );
  });
});

const createHealthClientStub = (
  client: Partial<IHealthServiceClient> & { close?: () => void }
): IHealthServiceClient => client as IHealthServiceClient;
