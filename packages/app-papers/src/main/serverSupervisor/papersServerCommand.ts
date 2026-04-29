import path from 'path';

export interface PapersServerCommandOptions {
  appPath: string;
  isPackaged: boolean;
  resourcesPath: string;
  userDataDir: string;
  platform?: NodeJS.Platform;
}

export interface PapersServerCommand {
  command: string;
  args: string[];
  cwd?: string;
}

export const resolvePapersServerCommand = ({
  appPath,
  isPackaged,
  resourcesPath,
  userDataDir,
  platform = process.platform
}: PapersServerCommandOptions): PapersServerCommand => {
  const accessLogPath = path.join(userDataDir, 'papers-server-access.log');
  const userDataArgs = ['--user-data-dir', userDataDir, '--access-log-path', accessLogPath];

  if (isPackaged) {
    const executableName = platform === 'win32' ? 'papers-server.exe' : 'papers-server';
    return {
      command: path.join(resourcesPath, 'papers-server', executableName),
      args: userDataArgs
    };
  }

  const repoRoot = path.resolve(appPath, '..', '..');
  const devServerScript = path.join(repoRoot, 'scripts', 'start-paper-server-dev.ps1');
  return {
    command: 'powershell',
    args: [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      devServerScript,
      '-UserDataDir',
      userDataDir,
      '-AccessLogPath',
      accessLogPath
    ],
    cwd: repoRoot
  };
};
