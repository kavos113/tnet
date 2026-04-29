import fs from 'fs/promises';
import {
  resolveWorkspacePath,
  type WorkspacePathRequest
} from '@tnet/main-core/workspace/workspacePath';

export const readFile = async (request: WorkspacePathRequest): Promise<string> => {
  const filePath = resolveWorkspacePath(request);
  return fs.readFile(filePath, 'utf-8');
};

export const createDirectory = async (request: WorkspacePathRequest): Promise<void> => {
  const dirPath = resolveWorkspacePath(request);
  const exists = await fs
    .access(dirPath)
    .then(() => true)
    .catch(() => false);
  if (exists) throw new Error('already exists');

  await fs.mkdir(dirPath, { recursive: true });
};
