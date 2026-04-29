import { describe, expect, it, vi } from 'vitest';
import { checkPapersServerHealth } from './papersServerHealth';

describe('checkPapersServerHealth', () => {
  it('returns health state from the Connect health endpoint', async () => {
    const testcases = [
      {
        name: 'healthy response',
        response: { ok: true, body: { status: 'ok' } },
        want: true
      },
      {
        name: 'unhealthy status',
        response: { ok: true, body: { status: 'starting' } },
        want: false
      },
      {
        name: 'http error',
        response: { ok: false, body: { status: 'ok' } },
        want: false
      }
    ];

    for (const testcase of testcases) {
      const fetchImpl = vi.fn(async () => ({
        ok: testcase.response.ok,
        json: async () => testcase.response.body
      }));

      await expect(checkPapersServerHealth('http://127.0.0.1:38911', fetchImpl)).resolves.toBe(
        testcase.want
      );
      expect(fetchImpl).toHaveBeenCalledWith(
        'http://127.0.0.1:38911/tnet.papers.v1.HealthService/Check',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}'
        }
      );
    }
  });

  it('returns false when the server is unreachable', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNREFUSED');
    });

    await expect(checkPapersServerHealth('http://127.0.0.1:38911', fetchImpl)).resolves.toBe(false);
  });
});
