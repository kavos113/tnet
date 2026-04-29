import { EventEmitter } from 'events';
import { describe, expect, it, vi } from 'vitest';
import { PapersServerSupervisor } from './papersServerSupervisor';

class FakeChildProcess extends EventEmitter {
  killed = false;

  kill(): boolean {
    this.killed = true;
    this.emit('exit', 0, null);
    return true;
  }
}

describe('PapersServerSupervisor', () => {
  it('starts only when health check is unavailable', async () => {
    const testcases = [
      {
        name: 'already running',
        healthResults: [true],
        wantStatus: 'already-running',
        wantSpawnCount: 0
      },
      {
        name: 'starts child process',
        healthResults: [false, true],
        wantStatus: 'started',
        wantSpawnCount: 1
      }
    ] as const;

    for (const testcase of testcases) {
      const healthResults = [...testcase.healthResults];
      const fetchImpl = vi.fn(async () => {
        const healthy =
          healthResults.shift() ?? testcase.healthResults[testcase.healthResults.length - 1];
        return {
          ok: healthy,
          json: async () => ({ status: healthy ? 'ok' : 'starting' })
        };
      });
      const spawnImpl = vi.fn(() => new FakeChildProcess() as never);
      const supervisor = new PapersServerSupervisor({
        command: { command: 'go', args: ['run', './cmd/papers-server'] },
        fetchImpl,
        spawnImpl,
        pollIntervalMs: 1,
        startupTimeoutMs: 100
      });

      await expect(supervisor.start()).resolves.toBe(testcase.wantStatus);
      expect(spawnImpl).toHaveBeenCalledTimes(testcase.wantSpawnCount);
    }
  });

  it('stops the child process it started', async () => {
    const child = new FakeChildProcess();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, json: async () => ({ status: 'starting' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ status: 'ok' }) });
    const supervisor = new PapersServerSupervisor({
      command: { command: 'go', args: ['run', './cmd/papers-server'] },
      fetchImpl,
      spawnImpl: vi.fn(() => child as never),
      pollIntervalMs: 1,
      startupTimeoutMs: 100
    });

    await supervisor.start();
    await supervisor.stop();

    expect(child.killed).toBe(true);
  });
});
