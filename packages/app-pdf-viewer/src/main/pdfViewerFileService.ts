import fs from 'fs/promises';
import path from 'path';
import { shell } from 'electron';
import type { PdfWorkspacePathRequest } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

export const loadPdfBytes = async (request: PdfWorkspacePathRequest): Promise<ArrayBuffer> => {
  const pdfPath = resolvePdfWorkspacePath(request);
  const bytes = await fs.readFile(pdfPath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

export const openPdfExternal = async (request: PdfWorkspacePathRequest): Promise<void> => {
  const pdfPath = resolvePdfWorkspacePath(request);
  const error = await shell.openPath(pdfPath);
  if (error) throw new Error(error);
};

export const resolvePdfWorkspacePath = ({
  rootDir,
  path: workspacePath
}: PdfWorkspacePathRequest): string => {
  if (!rootDir) throw new Error('rootDir is required');
  if (!workspacePath) throw new Error('path is required');
  if (path.isAbsolute(workspacePath)) throw new Error('absolute paths are not allowed');
  if (path.extname(workspacePath).toLowerCase() !== '.pdf')
    throw new Error('path must be a PDF file');

  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, workspacePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('path must be inside the workspace');
  }
  return resolved;
};
