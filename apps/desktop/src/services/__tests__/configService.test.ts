// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { defaultGlobalConfig } from '@tnet/shared/types/config';
import { loadGlobalConfig, saveGlobalConfig } from '../configService';

const tempDir = async (name: string): Promise<string> => {
  return fs.mkdtemp(path.join(os.tmpdir(), `tnet-${name}-`));
};

describe('config services', () => {
  it('returns default global config when the file does not exist', async () => {
    const userDataDir = await tempDir('global-config');

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual(defaultGlobalConfig());
  });

  it('saves and loads global config', async () => {
    const userDataDir = await tempDir('global-config-save');

    await saveGlobalConfig(userDataDir, {
      activeAppId: 'markdown',
      apps: {
        tasks: {},
        markdown: {
          lastOpenedDirectory: 'C:/workspace',
          activeWorkspaceRoot: 'C:/workspace',
          workspaceRoots: ['C:/workspace', 'D:/notes']
        }
      }
    });

    await expect(loadGlobalConfig(userDataDir)).resolves.toEqual({
      activeAppId: 'markdown',
      apps: {
        tasks: {},
        markdown: {
          lastOpenedDirectory: 'C:/workspace',
          activeWorkspaceRoot: 'C:/workspace',
          workspaceRoots: ['C:/workspace', 'D:/notes']
        },
        papers: {},
        requester: {},
        'db-inspector': {},
        code: {}
      }
    });
  });
});
