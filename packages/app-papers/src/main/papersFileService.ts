import fs from 'fs';
import path from 'path';
import { dialog, shell } from 'electron';
import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';
import { openPapersDatabase } from './papersDatabase';
import {
  papersImportedPdfDir,
  resolvePapersRelativePath,
  toPapersRelativePath
} from './papersPaths';
import { PapersRepository } from './papersRepository';

export interface ImportPdfRequest {
  libraryRoot: string;
  directoryPath?: string;
}

const withoutExtension = (filePath: string): string =>
  path.basename(filePath, path.extname(filePath));

const nextAvailablePath = (directory: string, fileName: string): string => {
  const parsed = path.parse(fileName);
  let candidate = path.join(directory, fileName);
  let counter = 2;

  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name} ${counter}${parsed.ext}`);
    counter += 1;
  }

  return candidate;
};

const withRepository = async <T>(
  libraryRoot: string,
  run: (repository: PapersRepository) => T
): Promise<T> => {
  const database = await openPapersDatabase(libraryRoot);
  try {
    return run(new PapersRepository(database));
  } finally {
    database.close();
  }
};

export const importPdfFromDialog = async (
  request: ImportPdfRequest
): Promise<PaperDetail | null> => {
  if (!request.libraryRoot) throw new Error('libraryRoot is required');

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const sourcePath = result.filePaths[0];
  const targetDir = papersImportedPdfDir(request.libraryRoot);
  fs.mkdirSync(targetDir, { recursive: true });

  const targetPath = nextAvailablePath(targetDir, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, targetPath);

  return await withRepository(request.libraryRoot, (repository) =>
    repository.createPaper({
      title: withoutExtension(sourcePath),
      pdfPath: toPapersRelativePath(request.libraryRoot, targetPath),
      directoryPath: request.directoryPath ?? ''
    })
  );
};

export const loadPdfBytes = (libraryRoot: string, pdfPath: string): ArrayBuffer => {
  if (!libraryRoot) throw new Error('libraryRoot is required');
  if (!pdfPath) throw new Error('pdfPath is required');

  const bytes = fs.readFileSync(resolvePapersRelativePath(libraryRoot, pdfPath));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

export const openPdfExternal = async (libraryRoot: string, pdfPath: string): Promise<void> => {
  if (!libraryRoot) throw new Error('libraryRoot is required');
  if (!pdfPath) throw new Error('pdfPath is required');

  await shell.openPath(resolvePapersRelativePath(libraryRoot, pdfPath));
};
