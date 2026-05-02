// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { loadTasksRuntimeConfig } from './tasksRuntimeConfig';
import { tasksRuntimeLocalConfigPath } from './tasksPaths';

const tempDir = async (name: string): Promise<string> =>
  fs.mkdtemp(path.join(os.tmpdir(), `tnet-tasks-runtime-${name}-`));

const writeRuntimeConfig = async (userDataDir: string, value: unknown): Promise<string> => {
  const configPath = tasksRuntimeLocalConfigPath(userDataDir);
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, JSON.stringify(value), 'utf-8');
  return configPath;
};

describe('Tasks runtime config', () => {
  it('returns an empty config when runtime.local.json is missing', async () => {
    const userDataDir = await tempDir('missing');

    expect(loadTasksRuntimeConfig(userDataDir)).toEqual({});
  });

  it('loads user agent and absolute Google credentials paths', async () => {
    const userDataDir = await tempDir('absolute');
    await writeRuntimeConfig(userDataDir, {
      calendarHttpUserAgent: 'tnet-tasks/1.0',
      googleCalendarCredentialsPath: 'C:\\Users\\dummy\\credentials.json'
    });

    expect(loadTasksRuntimeConfig(userDataDir)).toEqual({
      calendarHttpUserAgent: 'tnet-tasks/1.0',
      googleCalendarCredentialsPath: 'C:\\Users\\dummy\\credentials.json'
    });
  });

  it('resolves relative Google credentials paths from the tasks data directory', async () => {
    const userDataDir = await tempDir('relative');
    await writeRuntimeConfig(userDataDir, {
      googleCalendarCredentialsPath: 'google-oauth-client.json'
    });

    expect(loadTasksRuntimeConfig(userDataDir).googleCalendarCredentialsPath).toBe(
      path.join(userDataDir, 'tasks', 'google-oauth-client.json')
    );
  });

  it('reports malformed JSON with the config path', async () => {
    const userDataDir = await tempDir('malformed');
    const configPath = tasksRuntimeLocalConfigPath(userDataDir);
    await fs.mkdir(path.dirname(configPath), { recursive: true });
    await fs.writeFile(configPath, '{', 'utf-8');

    expect(() => loadTasksRuntimeConfig(userDataDir)).toThrow(configPath);
  });
});
