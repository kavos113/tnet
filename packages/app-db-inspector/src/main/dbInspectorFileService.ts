import path from 'path';
import fs from 'fs';
import { dialog } from 'electron';

export const selectSqliteDatabaseFile = async (): Promise<{
  path: string;
  name: string;
} | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  const filePath = result.filePaths[0];
  return result.canceled || !filePath ? null : { path: filePath, name: path.basename(filePath) };
};

export interface SaveTextFileRequest {
  defaultPath: string;
  content: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export const saveTextFile = async ({
  content,
  defaultPath,
  filters
}: SaveTextFileRequest): Promise<{ path: string } | null> => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: filters ?? [{ name: 'Text', extensions: ['txt'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, content, 'utf8');
  return { path: result.filePath };
};

export interface SaveBinaryFileRequest {
  defaultPath: string;
  base64Content: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}

export const saveBinaryFile = async ({
  base64Content,
  defaultPath,
  filters
}: SaveBinaryFileRequest): Promise<{ path: string } | null> => {
  const result = await dialog.showSaveDialog({
    defaultPath,
    filters: filters ?? [{ name: 'Binary', extensions: ['bin'] }]
  });
  if (result.canceled || !result.filePath) return null;
  fs.writeFileSync(result.filePath, Buffer.from(base64Content, 'base64'));
  return { path: result.filePath };
};
