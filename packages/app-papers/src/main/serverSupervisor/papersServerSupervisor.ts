import { spawn } from 'child_process';
import type { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'child_process';
import { checkPapersServerHealth, type PapersServerFetch } from './papersServerHealth';
import type { PapersServerCommand } from './papersServerCommand';

export interface PapersServerSupervisorOptions {
  baseUrl?: string;
  command: PapersServerCommand;
  fetchImpl?: PapersServerFetch;
  spawnImpl?: (
    command: string,
    args: readonly string[],
    options: SpawnOptionsWithoutStdio
  ) => ChildProcessWithoutNullStreams;
  startupTimeoutMs?: number;
  pollIntervalMs?: number;
}

export type PapersServerStartStatus = 'already-running' | 'started';

export class PapersServerSupervisor {
  private readonly baseUrl: string;
  private readonly command: PapersServerCommand;
  private readonly fetchImpl: PapersServerFetch;
  private readonly spawnImpl: NonNullable<PapersServerSupervisorOptions['spawnImpl']>;
  private readonly startupTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private childProcess: ChildProcessWithoutNullStreams | null = null;

  constructor({
    baseUrl = 'http://127.0.0.1:38911',
    command,
    fetchImpl,
    spawnImpl = spawn,
    startupTimeoutMs = 10_000,
    pollIntervalMs = 250
  }: PapersServerSupervisorOptions) {
    this.baseUrl = baseUrl;
    this.command = command;
    this.fetchImpl = fetchImpl ?? fetch;
    this.spawnImpl = spawnImpl;
    this.startupTimeoutMs = startupTimeoutMs;
    this.pollIntervalMs = pollIntervalMs;
  }

  async start(): Promise<PapersServerStartStatus> {
    if (await checkPapersServerHealth(this.baseUrl, this.fetchImpl)) {
      return 'already-running';
    }

    this.childProcess = this.spawnImpl(this.command.command, this.command.args, {
      cwd: this.command.cwd,
      windowsHide: true
    });

    console.log(`Started papers server with PID ${this.childProcess.pid}`);

    await this.waitUntilHealthy();
    return 'started';
  }

  async stop(): Promise<void> {
    if (!this.childProcess || this.childProcess.killed) return;

    const child = this.childProcess;
    this.childProcess = null;
    await new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      child.kill();
    });
  }

  private async waitUntilHealthy(): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < this.startupTimeoutMs) {
      if (await checkPapersServerHealth(this.baseUrl, this.fetchImpl)) return;
      await sleep(this.pollIntervalMs);
    }

    throw new Error('Timed out waiting for papers server to become healthy.');
  }
}

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
