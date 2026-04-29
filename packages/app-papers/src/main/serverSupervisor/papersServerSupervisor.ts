import { execFile, spawn } from 'child_process';
import type { ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'child_process';
import { checkPapersServerHealth, type PapersServerHealthCheck } from './papersServerHealth';
import type { PapersServerCommand } from './papersServerCommand';

export interface PapersServerSupervisorOptions {
  baseUrl?: string;
  command: PapersServerCommand;
  healthCheck?: PapersServerHealthCheck;
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
  private readonly healthCheck: PapersServerHealthCheck;
  private readonly spawnImpl: NonNullable<PapersServerSupervisorOptions['spawnImpl']>;
  private readonly startupTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private childProcess: ChildProcessWithoutNullStreams | null = null;

  constructor({
    baseUrl = 'http://127.0.0.1:38911',
    command,
    healthCheck = checkPapersServerHealth,
    spawnImpl = spawn,
    startupTimeoutMs = 10_000,
    pollIntervalMs = 250
  }: PapersServerSupervisorOptions) {
    console.log('PapersServerSupervisor initialized with command:', command);

    this.baseUrl = baseUrl;
    this.command = command;
    this.healthCheck = healthCheck;
    this.spawnImpl = spawnImpl;
    this.startupTimeoutMs = startupTimeoutMs;
    this.pollIntervalMs = pollIntervalMs;
  }

  async start(): Promise<PapersServerStartStatus> {
    console.log('Starting PapersServerSupervisor...');

    if (await this.healthCheck(this.baseUrl)) {
      console.log('PapersServerSupervisor found an already-running server.');
      return 'already-running';
    }

    this.childProcess = this.spawnImpl(this.command.command, this.command.args, {
      cwd: this.command.cwd,
      windowsHide: true
    });

    await this.waitUntilHealthy();
    console.log('PapersServerSupervisor started successfully.');
    return 'started';
  }

  async stop(): Promise<void> {
    console.log('Stopping PapersServerSupervisor...');
    if (!this.childProcess || this.childProcess.killed) return;

    const child = this.childProcess;
    this.childProcess = null;
    await new Promise<void>((resolve) => {
      child.once('exit', () => resolve());
      void terminateProcessTree(child).then(resolve);
    });
  }

  private async waitUntilHealthy(): Promise<void> {
    const startedAt = Date.now();
    while (Date.now() - startedAt < this.startupTimeoutMs) {
      if (await this.healthCheck(this.baseUrl)) return;
      await sleep(this.pollIntervalMs);
    }

    throw new Error('Timed out waiting for papers server to become healthy.');
  }
}

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const terminateProcessTree = async (child: ChildProcessWithoutNullStreams): Promise<void> => {
  if (process.platform === 'win32' && child.pid) {
    await new Promise<void>((resolve) => {
      execFile('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], () => resolve());
    });
    return;
  }

  child.kill();
};
