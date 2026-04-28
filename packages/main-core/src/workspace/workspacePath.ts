import path from 'path';

export interface WorkspacePathRequest {
  rootDir: string;
  path: string;
}

export interface RenameWorkspacePathRequest {
  rootDir: string;
  oldPath: string;
  newPath: string;
}

export const resolveWorkspacePath = ({
  rootDir,
  path: workspacePath
}: WorkspacePathRequest): string => {
  if (!rootDir) throw new Error('rootDir is required');
  if (!workspacePath) return rootDir;
  if (path.isAbsolute(workspacePath)) return workspacePath;
  return path.resolve(rootDir, workspacePath);
};
