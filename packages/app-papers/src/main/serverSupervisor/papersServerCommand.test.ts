import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolvePapersServerCommand } from './papersServerCommand';

describe('resolvePapersServerCommand', () => {
  it('resolves the command for development and packaged apps', () => {
    const testcases = [
      {
        name: 'development',
        options: {
          appPath: path.join('C:', 'dummy-repo', 'apps', 'desktop'),
          isPackaged: false,
          resourcesPath: path.join('C:', 'dummy-repo', 'resources'),
          userDataDir: path.join('C:', 'dummy-user-data', 'tnet'),
          platform: 'win32' as NodeJS.Platform
        },
        wantCommand: 'powershell',
        wantArgs: [
          '-NoProfile',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          path.join('C:', 'dummy-repo', 'scripts', 'start-paper-server-dev.ps1'),
          '-UserDataDir',
          path.join('C:', 'dummy-user-data', 'tnet'),
          '-AccessLogPath',
          path.join('C:', 'dummy-user-data', 'tnet', 'papers-server-access.log')
        ],
        wantCwd: path.join('C:', 'dummy-repo')
      },
      {
        name: 'packaged windows',
        options: {
          appPath: path.join('C:', 'dummy-app', 'tnet'),
          isPackaged: true,
          resourcesPath: path.join('C:', 'dummy-app', 'tnet', 'resources'),
          userDataDir: path.join('C:', 'dummy-user-data', 'tnet'),
          platform: 'win32' as NodeJS.Platform
        },
        wantCommand: path.join(
          'C:',
          'dummy-app',
          'tnet',
          'resources',
          'papers-server',
          'papers-server.exe'
        ),
        wantArgs: [
          '--user-data-dir',
          path.join('C:', 'dummy-user-data', 'tnet'),
          '--access-log-path',
          path.join('C:', 'dummy-user-data', 'tnet', 'papers-server-access.log')
        ],
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
