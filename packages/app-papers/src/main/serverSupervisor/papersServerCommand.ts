import fs from 'fs';
import path from 'path';

export interface PapersServerCommandOptions {
  appPath: string;
  isPackaged: boolean;
  resourcesPath: string;
  userDataDir: string;
  platform?: NodeJS.Platform;
  executableExists?: (filePath: string) => boolean;
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
  platform = process.platform,
  executableExists = fs.existsSync
}: PapersServerCommandOptions): PapersServerCommand => {
  const accessLogPath = path.join(userDataDir, 'papers-server-access.log');
  const userDataArgs = ['--user-data-dir', userDataDir, '--access-log-path', accessLogPath];
  const executableName = platform === 'win32' ? 'papers-server.exe' : 'papers-server';

  if (isPackaged) {
    return {
      command: path.join(resourcesPath, 'papers-server', executableName),
      args: userDataArgs
    };
  }

  const repoRoot = path.resolve(appPath, '..', '..');
  const devServerExecutable = path.join(repoRoot, 'dist', 'papers-server', executableName);
  if (!executableExists(devServerExecutable)) {
    throw new Error(
      `Papers server executable was not found at ${devServerExecutable}. Run pnpm papers:server:build before starting the desktop app.`
    );
  }

  return {
    command: devServerExecutable,
    args: userDataArgs
  };
};
