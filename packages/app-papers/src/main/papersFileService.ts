import path from 'path';
import { clipboard, dialog, shell } from 'electron';
import type { SelectedPdfImportCandidate } from '@tnet/app-papers/shared/ipc';
import {
  isInsidePapersLibrary,
  resolvePapersRelativePath,
  toPapersRelativePath
} from './papersPaths';

export interface ImportPdfRequest {
  libraryRoot: string;
  directoryPath?: string;
}

const withoutExtension = (filePath: string): string =>
  path.basename(filePath, path.extname(filePath));

const normalizeDirectoryPath = (directoryPath?: string): string =>
  (directoryPath ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

export const selectPdfForImport = async (
  request: ImportPdfRequest
): Promise<SelectedPdfImportCandidate | null> => {
  if (!request.libraryRoot) throw new Error('libraryRoot is required');

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const sourcePath = result.filePaths[0];
  const sourceRelativePath = isInsidePapersLibrary(request.libraryRoot, sourcePath)
    ? toPapersRelativePath(request.libraryRoot, sourcePath)
    : undefined;

  return {
    sourcePath,
    suggestedTitle: withoutExtension(sourcePath),
    clipboardBibtex: clipboard.readText(),
    sourceRelativePath,
    willCopy: sourceRelativePath === undefined,
    targetDirectoryPath: normalizeDirectoryPath(request.directoryPath)
  };
};

export const openPdfExternal = async (libraryRoot: string, pdfPath: string): Promise<void> => {
  if (!libraryRoot) throw new Error('libraryRoot is required');
  if (!pdfPath) throw new Error('pdfPath is required');

  await shell.openPath(resolvePapersRelativePath(libraryRoot, pdfPath));
};
