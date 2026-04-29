import fs from 'fs';
import path from 'path';
import { dialog, shell } from 'electron';
import type {
  CreatePaperFromPdfRequest,
  SelectedPdfImportCandidate
} from '@tnet/app-papers/shared/ipc';
import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';
import { openPapersDatabase } from './papersDatabase';
import {
  isInsidePapersLibrary,
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

const normalizeDirectoryPath = (directoryPath?: string): string =>
  (directoryPath ?? '').replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

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

const targetImportDirectory = (libraryRoot: string, directoryPath?: string): string => {
  const normalizedDirectoryPath = normalizeDirectoryPath(directoryPath);
  return normalizedDirectoryPath
    ? resolvePapersRelativePath(libraryRoot, normalizedDirectoryPath)
    : papersImportedPdfDir(libraryRoot);
};

const targetRecordDirectoryPath = (relativePdfPath: string): string => {
  const directory = path.posix.dirname(relativePdfPath);
  return directory === '.' || directory === 'papers' ? '' : directory;
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
    sourceRelativePath,
    willCopy: sourceRelativePath === undefined,
    targetDirectoryPath: normalizeDirectoryPath(request.directoryPath)
  };
};

export const createPaperFromPdf = async (
  request: CreatePaperFromPdfRequest
): Promise<PaperDetail> => {
  if (!request.libraryRoot) throw new Error('libraryRoot is required');
  if (!request.sourcePath) throw new Error('sourcePath is required');
  const title = request.title.trim();
  if (!title) throw new Error('title is required');

  let pdfPath: string;
  if (isInsidePapersLibrary(request.libraryRoot, request.sourcePath)) {
    pdfPath = toPapersRelativePath(request.libraryRoot, request.sourcePath);
  } else {
    const targetDir = targetImportDirectory(request.libraryRoot, request.directoryPath);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = nextAvailablePath(targetDir, path.basename(request.sourcePath));
    fs.copyFileSync(request.sourcePath, targetPath);
    pdfPath = toPapersRelativePath(request.libraryRoot, targetPath);
  }

  return withRepository(request.libraryRoot, (repository) =>
    repository.createPaper({
      title,
      authors: request.authors,
      abstract: request.abstract,
      publishedYear: request.publishedYear,
      venue: request.venue,
      doi: request.doi,
      arxivId: request.arxivId,
      url: request.url,
      pdfPath,
      directoryPath: targetRecordDirectoryPath(pdfPath)
    })
  );
};

export const importPdfFromDialog = async (
  request: ImportPdfRequest
): Promise<PaperDetail | null> => {
  const candidate = await selectPdfForImport(request);
  if (!candidate) return null;

  return createPaperFromPdf({
    libraryRoot: request.libraryRoot,
    sourcePath: candidate.sourcePath,
    title: candidate.suggestedTitle,
    directoryPath: request.directoryPath
  });
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
