import { toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { normalizePdfRelativePath, workspaceNameForRoot } from './pdfLink';

export const findPdfWorkspaceRootsByName = (
  workspaceRoots: string[],
  workspaceName: string
): string[] => workspaceRoots.filter((root) => workspaceNameForRoot(root) === workspaceName);

export const hasPdfFileInTree = (
  fileTree: FileItem[],
  rootPath: string,
  relativePath: string
): boolean => {
  const normalizedTarget = normalizePdfRelativePath(relativePath);
  return fileTree.some((item) => hasPdfFileInItem(item, rootPath, normalizedTarget));
};

const hasPdfFileInItem = (item: FileItem, rootPath: string, normalizedTarget: string): boolean => {
  if (item.isDirectory) {
    return (item.children ?? []).some((child) =>
      hasPdfFileInItem(child, rootPath, normalizedTarget)
    );
  }
  if (!item.name.toLowerCase().endsWith('.pdf')) return false;
  return (
    normalizePdfRelativePath(toWorkspaceRelativePath(rootPath, item.path)) === normalizedTarget
  );
};
