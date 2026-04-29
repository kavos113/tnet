import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog: vi.fn()
  },
  shell: {
    openPath: vi.fn()
  }
}));

import { dialog } from 'electron';
import { importPdfFromDialog, loadPdfBytes } from './papersFileService';

describe('papersFileService', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-papers-files-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('imports a selected PDF into the library papers directory', async () => {
    const sourcePath = path.join(tempDir, 'source.pdf');
    const libraryRoot = path.join(tempDir, 'library');
    fs.mkdirSync(libraryRoot, { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [sourcePath]
    });

    const paper = await importPdfFromDialog({ libraryRoot });

    expect(paper?.title).toBe('source');
    expect(paper?.pdfPath).toBe('papers/source.pdf');
    expect(fs.readFileSync(path.join(libraryRoot, 'papers', 'source.pdf'), 'utf8')).toBe(
      'pdf-bytes'
    );
  });

  it('loads PDF bytes from a library-relative path', () => {
    const libraryRoot = path.join(tempDir, 'library');
    const pdfPath = path.join(libraryRoot, 'papers', 'paper.pdf');
    fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    fs.writeFileSync(pdfPath, 'pdf-bytes');

    const bytes = loadPdfBytes(libraryRoot, 'papers/paper.pdf');

    expect(Buffer.from(bytes).toString('utf8')).toBe('pdf-bytes');
  });
});
