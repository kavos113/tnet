import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolvePapersServerCommand } from './papersServerCommand';

describe('resolvePapersServerCommand', () => {
  it('resolves the command for development and packaged apps', () => {
    const testcases = [
      {
        name: 'development',
        options: {
          appPath: path.join('C:', 'repo', 'apps', 'desktop'),
          isPackaged: false,
          resourcesPath: path.join('C:', 'repo', 'resources'),
          platform: 'win32' as NodeJS.Platform
        },
        wantCommand: 'go',
        wantArgs: ['run', './cmd/papers-server'],
        wantCwd: path.join('C:', 'repo', 'services', 'papers-server')
      },
      {
        name: 'packaged windows',
        options: {
          appPath: path.join('C:', 'Program Files', 'tnet'),
          isPackaged: true,
          resourcesPath: path.join('C:', 'Program Files', 'tnet', 'resources'),
          platform: 'win32' as NodeJS.Platform
        },
        wantCommand: path.join(
          'C:',
          'Program Files',
          'tnet',
          'resources',
          'papers-server',
          'papers-server.exe'
        ),
        wantArgs: [],
        wantCwd: undefined
      }
    ];

    for (const testcase of testcases) {
      const command = resolvePapersServerCommand(testcase.options);

      expect(command.command, testcase.name).toBe(testcase.wantCommand);
      expect(command.args, testcase.name).toEqual(testcase.wantArgs);
      expect(command.cwd, testcase.name).toBe(testcase.wantCwd);
    }
  });
});
