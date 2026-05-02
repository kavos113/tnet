// @vitest-environment node
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  cleanupOfficePreviewCache,
  getOfficePreviewCacheKey,
  resolvePdfWorkspacePath,
  resolvePreviewWorkspacePath
} from './pdfViewerFileService';

describe('PDF viewer file service', () => {
  it('resolves PDF paths inside the workspace', () => {
    expect(
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'slides/talk.pdf'
      })
    ).toBe(path.resolve('C:/workspace', 'slides/talk.pdf'));
  });

  it('rejects unsafe or non-PDF paths', () => {
    expect(() =>
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: '../secret.pdf'
      })
    ).toThrow('inside the workspace');
    expect(() =>
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'notes.txt'
      })
    ).toThrow('PDF');
  });

  it('resolves Office files as previewable workspace paths without treating them as PDF links', () => {
    expect(
      resolvePreviewWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'slides/deck.pptx'
      })
    ).toBe(path.resolve('C:/workspace', 'slides/deck.pptx'));
    expect(() =>
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'slides/deck.pptx'
      })
    ).toThrow('PDF');
  });

  it('builds a converted Office cache key from source metadata and converter settings', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-pdf-office-cache-'));
    const filePath = path.join(root, 'sample.docx');
    await fs.writeFile(filePath, 'dummy', 'utf-8');

    await expect(
      getOfficePreviewCacheKey(filePath, {
        defaultZoomMode: 'page-width',
        defaultCustomScale: 1,
        defaultColumns: 1,
        overscanPages: 2,
        workspaceRoots: [],
        officeConverterKind: 'libreoffice',
        officeConverterPath: 'soffice',
        officeConverterTimeoutMs: 30000,
        officePreviewCacheDir: ''
      })
    ).resolves.toMatch(/^[a-f0-9]{64}$/);
  });

  it('keeps only the newest converted Office preview cache entries', async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'tnet-pdf-office-cleanup-'));
    await fs.writeFile(path.join(root, 'old.pdf'), 'old', 'utf-8');
    await fs.writeFile(path.join(root, 'new.pdf'), 'new', 'utf-8');
    const oldTime = new Date(1000);
    const newTime = new Date(2000);
    await fs.utimes(path.join(root, 'old.pdf'), oldTime, oldTime);
    await fs.utimes(path.join(root, 'new.pdf'), newTime, newTime);

    await cleanupOfficePreviewCache(root, 1);

    await expect(fs.access(path.join(root, 'new.pdf'))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, 'old.pdf'))).rejects.toBeDefined();
  });
});
