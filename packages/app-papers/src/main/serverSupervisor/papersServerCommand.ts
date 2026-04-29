import path from 'path';

export interface PapersServerCommandOptions {
  appPath: string;
  isPackaged: boolean;
  resourcesPath: string;
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
  platform = process.platform
}: PapersServerCommandOptions): PapersServerCommand => {
  if (isPackaged) {
    const executableName = platform === 'win32' ? 'papers-server.exe' : 'papers-server';
    return {
      command: path.join(resourcesPath, 'papers-server', executableName),
      args: []
    };
  }

  const serverRoot = path.resolve(appPath, '..', '..', 'services', 'papers-server');
  return {
    command: 'go',
    args: ['run', './cmd/papers-server'],
    cwd: serverRoot
  };
};
