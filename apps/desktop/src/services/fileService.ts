import fs from 'fs/promises';
import {
  resolveWorkspacePath as resolveUncheckedWorkspacePath,
  resolveWorkspacePath,
  type RenameWorkspacePathRequest,
  type WorkspacePathRequest
} from '@tnet/main-core/workspace/workspacePath';
import path from 'path';

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

export const renamePath = async (request: RenameWorkspacePathRequest): Promise<void> => {
  await movePath(request);
};

export const movePath = async ({
  rootDir,
  oldPath,
  newPath
}: RenameWorkspacePathRequest): Promise<void> => {
  const sourcePath = resolveSafeWorkspacePath({ rootDir, path: oldPath });
  const targetPath = resolveSafeWorkspacePath({ rootDir, path: newPath });
  const exists = await fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
  if (exists) throw new Error('destination already exists');
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.rename(sourcePath, targetPath);
};

const resolveSafeWorkspacePath = (request: WorkspacePathRequest): string => {
  const resolved = resolveUncheckedWorkspacePath(request);
  const root = path.resolve(request.rootDir);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('path must stay inside rootDir');
  }
  return resolved;
};
