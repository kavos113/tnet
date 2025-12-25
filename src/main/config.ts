import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

const CONFIG_FILE_NAME = 'config.json';

export interface GlobalConfig {
  lastOpenedDirectory?: string;
}

export const loadConfig = async (): Promise<GlobalConfig> => {
  const rawFile = await fs.readFile(configPath(), 'utf-8');
  return JSON.parse(rawFile);
};

export const saveConfig = async (config: GlobalConfig): Promise<void> => {
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(configPath(), JSON.stringify(config));
};

const configPath = (): string => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, CONFIG_FILE_NAME);
};
