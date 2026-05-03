import fs from 'fs/promises';
import path from 'path';

export const readJsonFileOrDefault = async <T>(filePath: string, defaultValue: T): Promise<T> => {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
};

export const loadNormalizedJsonConfig = async <T>(options: {
  filePath: string;
  defaultValue: T;
  normalize: (value: Partial<T>) => T;
}): Promise<T> => {
  const value = await readJsonFileOrDefault<Partial<T>>(options.filePath, options.defaultValue);
  return options.normalize(value);
};

export const writeJsonFile = async <T>(filePath: string, value: T): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), 'utf-8');
};
