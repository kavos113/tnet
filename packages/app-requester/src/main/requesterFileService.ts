import fs from 'fs/promises';
import path from 'path';
import { dialog, shell } from 'electron';
import { requesterDataDir } from './requesterPaths';

export const selectBinaryBodyFile = async (): Promise<{ path: string; name: string } | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return {
    path: result.filePaths[0],
    name: path.basename(result.filePaths[0])
  };
};

export const saveResponseBody = async (request: {
  suggestedName: string;
  bodyText: string;
  bodyBase64?: string;
}): Promise<string | null> => {
  const result = await dialog.showSaveDialog({
    defaultPath: request.suggestedName
  });
  if (result.canceled || !result.filePath) return null;
  const content = request.bodyBase64
    ? Buffer.from(request.bodyBase64, 'base64')
    : Buffer.from(request.bodyText, 'utf-8');
  await fs.writeFile(result.filePath, content);
  return result.filePath;
};

export const openResponseExternally = async (
  userDataDir: string,
  request: {
    suggestedName: string;
    bodyText: string;
    bodyBase64?: string;
  }
): Promise<void> => {
  const responseDir = path.join(requesterDataDir(userDataDir), 'tmp', 'response');
  await fs.mkdir(responseDir, { recursive: true });
  const targetPath = path.join(responseDir, request.suggestedName);
  const content = request.bodyBase64
    ? Buffer.from(request.bodyBase64, 'base64')
    : Buffer.from(request.bodyText, 'utf-8');
  await fs.writeFile(targetPath, content);
  await shell.openPath(targetPath);
};
