import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import crypto from 'crypto';
import { app, shell } from 'electron';
import { promisify } from 'util';
import type { PdfViewerGlobalSettings } from '@tnet/app-pdf-viewer/shared/config';
import type { PdfWorkspacePathRequest } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

const execFileAsync = promisify(execFile);

const previewableExtensions = new Set(['.pdf', '.docx', '.xlsx', '.pptx']);

export const loadPdfBytes = async (
  request: PdfWorkspacePathRequest,
  settings?: PdfViewerGlobalSettings
): Promise<ArrayBuffer> => {
  const documentPath = resolvePreviewWorkspacePath(request);
  const pdfPath =
    path.extname(documentPath).toLowerCase() === '.pdf'
      ? documentPath
      : await convertOfficeDocumentToPdf(documentPath, settings);
  const bytes = await fs.readFile(pdfPath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
};

export const openPdfExternal = async (request: PdfWorkspacePathRequest): Promise<void> => {
  const pdfPath = resolvePreviewWorkspacePath(request);
  const error = await shell.openPath(pdfPath);
  if (error) throw new Error(error);
};

export const resolvePdfWorkspacePath = ({
  rootDir,
  path: workspacePath
}: PdfWorkspacePathRequest): string => {
  const resolved = resolvePreviewWorkspacePath({ rootDir, path: workspacePath });
  if (path.extname(resolved).toLowerCase() !== '.pdf') throw new Error('path must be a PDF file');
  return resolved;
};

export const resolvePreviewWorkspacePath = ({
  rootDir,
  path: workspacePath
}: PdfWorkspacePathRequest): string => {
  if (!rootDir) throw new Error('rootDir is required');
  if (!workspacePath) throw new Error('path is required');
  if (path.isAbsolute(workspacePath)) throw new Error('absolute paths are not allowed');
  if (!previewableExtensions.has(path.extname(workspacePath).toLowerCase())) {
    throw new Error('path must be a PDF or Office previewable file');
  }

  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, workspacePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('path must be inside the workspace');
  }
  return resolved;
};

export const getOfficePreviewCacheKey = async (
  sourcePath: string,
  settings: PdfViewerGlobalSettings,
  converterVersion = settings.officeConverterPath || settings.officeConverterKind
): Promise<string> => {
  const stats = await fs.stat(sourcePath);
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        sourcePath: path.resolve(sourcePath),
        size: stats.size,
        mtimeMs: stats.mtimeMs,
        converterKind: settings.officeConverterKind,
        converterVersion
      })
    )
    .digest('hex');
};

const convertOfficeDocumentToPdf = async (
  sourcePath: string,
  settings?: PdfViewerGlobalSettings
): Promise<string> => {
  if (!settings || settings.officeConverterKind !== 'libreoffice') {
    throw new Error('Office preview converter is not configured.');
  }
  const converterPath = settings.officeConverterPath?.trim() || 'soffice';
  const cacheRoot =
    settings.officePreviewCacheDir?.trim() ||
    path.join(app.getPath('userData'), 'pdf-viewer-office-preview-cache');
  await fs.mkdir(cacheRoot, { recursive: true });
  const converterVersion = await getOfficeConverterVersion(
    converterPath,
    settings.officeConverterTimeoutMs
  );
  const cachePath = path.join(
    cacheRoot,
    `${await getOfficePreviewCacheKey(sourcePath, settings, converterVersion)}.pdf`
  );
  if (await pathExists(cachePath)) return cachePath;

  const outputDir = path.join(cacheRoot, 'tmp', crypto.randomUUID());
  await fs.mkdir(outputDir, { recursive: true });
  try {
    await execFileAsync(
      converterPath,
      ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, sourcePath],
      {
        timeout: settings.officeConverterTimeoutMs,
        windowsHide: true
      }
    );
    const convertedPath = path.join(
      outputDir,
      `${path.basename(sourcePath, path.extname(sourcePath))}.pdf`
    );
    await fs.rename(convertedPath, cachePath);
    await cleanupOfficePreviewCache(cacheRoot);
    return cachePath;
  } catch (error) {
    throw new Error(`Office preview conversion failed: ${getErrorMessage(error)}`);
  } finally {
    await fs.rm(outputDir, { recursive: true, force: true });
  }
};

const getOfficeConverterVersion = async (
  converterPath: string,
  timeout: number
): Promise<string> => {
  try {
    const { stdout } = await execFileAsync(converterPath, ['--version'], {
      timeout,
      windowsHide: true
    });
    return stdout.trim() || converterPath;
  } catch {
    return converterPath;
  }
};

export const cleanupOfficePreviewCache = async (
  cacheRoot: string,
  maxEntries = 200
): Promise<void> => {
  const entries = await fs.readdir(cacheRoot, { withFileTypes: true });
  const pdfEntries = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.pdf'))
      .map(async (entry) => {
        const filePath = path.join(cacheRoot, entry.name);
        const stats = await fs.stat(filePath);
        return { filePath, mtimeMs: stats.mtimeMs };
      })
  );
  const staleEntries = pdfEntries
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .slice(maxEntries);
  await Promise.all(staleEntries.map((entry) => fs.rm(entry.filePath, { force: true })));
};

const pathExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
