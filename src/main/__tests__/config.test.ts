import { describe, expect, it, vi, beforeEach } from 'vitest';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';

vi.mock('electron', () => ({
  app: {
    getPath: vi.fn()
  }
}));

import { app } from 'electron';
import { loadConfig, saveConfig } from '../config';

describe('src/main/config.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saveConfig: userData配下にconfig.jsonを書き込む', async () => {
    const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-config-'));
    vi.mocked(app.getPath).mockReturnValue(userDataPath);

    await saveConfig({ lastOpenedDirectory: 'C:/tmp' });

    const saved = await fs.readFile(path.join(userDataPath, 'config.json'), 'utf-8');
    expect(JSON.parse(saved)).toEqual({ lastOpenedDirectory: 'C:/tmp' });
  });

  it('loadConfig: userData配下のconfig.jsonを読み込む', async () => {
    const userDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-config-'));
    vi.mocked(app.getPath).mockReturnValue(userDataPath);

    await fs.writeFile(
      path.join(userDataPath, 'config.json'),
      JSON.stringify({ lastOpenedDirectory: 'D:/docs' }),
      'utf-8'
    );

    await expect(loadConfig()).resolves.toEqual({ lastOpenedDirectory: 'D:/docs' });
  });
});
