import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadNormalizedJsonConfig, writeJsonFile } from './jsonFile';

const tempDirs: string[] = [];

const createTempDir = async (): Promise<string> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-json-'));
  tempDirs.push(tempDir);
  return tempDir;
};

describe('json file storage helpers', () => {
  afterEach(async () => {
    await Promise.all(
      tempDirs.splice(0).map((tempDir) => fs.rm(tempDir, { recursive: true, force: true }))
    );
  });

  it('loads a normalized default when the file is missing', async () => {
    const config = await loadNormalizedJsonConfig({
      filePath: path.join(await createTempDir(), 'missing.json'),
      defaultValue: { enabled: true, count: 1 },
      normalize: (value) => ({
        enabled: value.enabled ?? false,
        count: value.count && value.count > 0 ? value.count : 10
      })
    });

    expect(config).toEqual({ enabled: true, count: 1 });
  });

  it('writes formatted JSON', async () => {
    const filePath = path.join(await createTempDir(), 'nested', 'config.json');
    await writeJsonFile(filePath, { enabled: true });

    await expect(fs.readFile(filePath, 'utf-8')).resolves.toBe('{\n  "enabled": true\n}');
  });
});
