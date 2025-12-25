import path from 'path';
import fs from 'fs/promises';
import { FileItem } from '@fixtures/file';

const SETTINGS_DIR_PATH = '.tnet';
const SESSION_FILE_NAME = 'session.json';
const KEYWORDS_FILE_NAME = 'keywords.json';
const FILE_TEMPLATE = `<keyword name="">
### 変数・条件


### 主張

</keyword>

<details>
<summary>証明</summary>

</details>`;
const KEYWORD_REGEX = /<keyword name="([^>"]*)">([\s\S]*?)<\/keyword>/g;

/*
keywords.json

name: path
*/

export const getFileTree = async (dirPath: string): Promise<FileItem[]> => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          try {
            const children = await getFileTree(fullPath);
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: true,
              children: children
            };
          } catch {
            return {
              name: entry.name,
              path: fullPath,
              isDirectory: true,
              children: []
            };
          }
        } else {
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: false
          };
        }
      })
    );

    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });

    return result;
  } catch (err) {
    console.error('error occured while get file tree', err);
    throw new Error('error occured while get file tree');
  }
};

export const readFile = async (filePath: string): Promise<string> => {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (err) {
    console.error('error reading file: ', err);
    throw new Error('error reading file');
  }
};

export const writeFile = async (
  filePath: string,
  content: string,
  rootDir: string
): Promise<void> => {
  await writeFileRaw(filePath, content);

  await extractAndSaveKeywords(filePath, content, rootDir);
};

export const createFile = async (filePath: string): Promise<void> => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, FILE_TEMPLATE, 'utf-8');
  } catch (err) {
    console.error('error writing file: ', err);
    throw new Error('error writing file');
  }
};

export const saveSession = async (rootDir: string, filePaths: string[]): Promise<void> => {
  await ensureSettingDirExists(rootDir);
  await writeFileRaw(sessionFilePath(rootDir), JSON.stringify(filePaths));
};

export const loadSession = async (rootDir: string): Promise<string[]> => {
  if (rootDir == '') {
    return [];
  }

  const filePaths: string[] = JSON.parse(await readFile(sessionFilePath(rootDir)));
  return filePaths;
};

export const loadKeywords = async (rootDir: string): Promise<Record<string, string>> => {
  if (rootDir == '') {
    return {};
  }

  const keywords: Record<string, string> = JSON.parse(await readFile(keywordsFilePath(rootDir)));
  return keywords;
};

const ensureSettingDirExists = async (rootDir: string): Promise<void> => {
  await fs.mkdir(path.join(rootDir, SETTINGS_DIR_PATH), { recursive: true });
};

const sessionFilePath = (rootDir: string): string =>
  path.join(rootDir, SETTINGS_DIR_PATH, SESSION_FILE_NAME);
const keywordsFilePath = (rootDir: string): string =>
  path.join(rootDir, SETTINGS_DIR_PATH, KEYWORDS_FILE_NAME);

const writeFileRaw = async (filePath: string, content: string): Promise<void> => {
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  } catch (err) {
    console.error('error writing file: ', err);
    throw new Error('error writing file');
  }
};

const extractAndSaveKeywords = async (
  filePath: string,
  content: string,
  rootDir: string
): Promise<void> => {
  await ensureSettingDirExists(rootDir);

  let keywords: Record<string, string>;
  try {
    const raw = await fs.readFile(keywordsFilePath(rootDir), 'utf-8');
    keywords = JSON.parse(raw);
  } catch {
    keywords = {};
  }

  for (const [key, value] of Object.entries(keywords)) {
    if (value == filePath) {
      delete keywords[key];
    }
  }

  KEYWORD_REGEX.lastIndex = 0;
  let array: RegExpExecArray | null;
  while ((array = KEYWORD_REGEX.exec(content)) !== null) {
    if (array.length > 1) {
      keywords[array[1]] = filePath;
    }
  }

  await writeFileRaw(keywordsFilePath(rootDir), JSON.stringify(keywords));
};
