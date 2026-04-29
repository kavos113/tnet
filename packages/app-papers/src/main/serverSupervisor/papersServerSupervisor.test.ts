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
      const healthCheck = vi.fn(async () => {
        const healthy =
          healthResults.shift() ?? testcase.healthResults[testcase.healthResults.length - 1];
        return healthy;
      });
      const spawnImpl = vi.fn(() => new FakeChildProcess() as never);
      const openLogFile = vi.fn(() => 123);
      const supervisor = new PapersServerSupervisor({
        command: {
          command: 'go',
          args: ['run', './cmd/papers-server'],
          logPath: 'papers-server.log'
        },
        healthCheck,
        spawnImpl,
        openLogFile,
        pollIntervalMs: 1,
        startupTimeoutMs: 100
      });

      await expect(supervisor.start()).resolves.toBe(testcase.wantStatus);
      expect(spawnImpl).toHaveBeenCalledTimes(testcase.wantSpawnCount);
      expect(openLogFile).toHaveBeenCalledTimes(testcase.wantSpawnCount);
    }
  });

  it('stops the child process it started', async () => {
    const child = new FakeChildProcess();
    const healthCheck = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const closeLogFile = vi.fn();
    const supervisor = new PapersServerSupervisor({
      command: {
        command: 'go',
        args: ['run', './cmd/papers-server'],
        logPath: 'papers-server.log'
      },
      healthCheck,
      spawnImpl: vi.fn(() => child as never),
      openLogFile: vi.fn(() => 123),
      closeLogFile,
      pollIntervalMs: 1,
      startupTimeoutMs: 100
    });

    await supervisor.start();
    await supervisor.stop();

    expect(child.killed).toBe(true);
    expect(closeLogFile).toHaveBeenCalledWith(123);
  });

  it('redirects stdout and stderr to the papers server log file', async () => {
    const healthCheck = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const spawnImpl = vi.fn(() => new FakeChildProcess() as never);
    const supervisor = new PapersServerSupervisor({
      command: {
        command: 'go',
        args: ['run', './cmd/papers-server'],
        logPath: 'papers-server.log'
      },
      healthCheck,
      spawnImpl,
      openLogFile: vi.fn(() => 456),
      pollIntervalMs: 1,
      startupTimeoutMs: 100
    });

    await supervisor.start();

    expect(spawnImpl).toHaveBeenCalledWith(
      'go',
      ['run', './cmd/papers-server'],
      expect.objectContaining({
        stdio: ['ignore', 456, 456]
      })
    );
  });
});
