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
  const userDataArgs = ['--user-data-dir', userDataDir];

  if (isPackaged) {
    const executableName = platform === 'win32' ? 'papers-server.exe' : 'papers-server';
    return {
      command: path.join(resourcesPath, 'papers-server', executableName),
      args: userDataArgs
    };
  }

  const serverRoot = path.resolve(appPath, '..', '..', 'services', 'papers-server');
  return {
    command: 'go',
    args: ['run', './cmd/papers-server', '--', ...userDataArgs],
    cwd: serverRoot
  };
};
