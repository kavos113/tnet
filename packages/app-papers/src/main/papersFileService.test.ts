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
import { createPaperFromPdf, loadPdfBytes, selectPdfForImport } from './papersFileService';

describe('papersFileService', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnet-papers-files-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
    vi.clearAllMocks();
  });

  it('copies an external PDF into the library papers directory when creating a paper', async () => {
    const sourcePath = path.join(tempDir, 'source.pdf');
    const libraryRoot = path.join(tempDir, 'library');
    fs.mkdirSync(libraryRoot, { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');

    const paper = await createPaperFromPdf({ libraryRoot, sourcePath, title: 'Imported paper' });

    expect(paper.title).toBe('Imported paper');
    expect(paper.pdfPath).toBe('papers/source.pdf');
    expect(fs.readFileSync(path.join(libraryRoot, 'papers', 'source.pdf'), 'utf8')).toBe(
      'pdf-bytes'
    );
  });

  it('copies an external PDF into the selected library directory', async () => {
    const sourcePath = path.join(tempDir, 'source.pdf');
    const libraryRoot = path.join(tempDir, 'library');
    fs.mkdirSync(libraryRoot, { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');

    const paper = await createPaperFromPdf({
      libraryRoot,
      sourcePath,
      title: 'Imported paper',
      directoryPath: 'logic/set-theory'
    });

    expect(paper.pdfPath).toBe('logic/set-theory/source.pdf');
    expect(paper.directoryPath).toBe('logic/set-theory');
    expect(
      fs.readFileSync(path.join(libraryRoot, 'logic', 'set-theory', 'source.pdf'), 'utf8')
    ).toBe('pdf-bytes');
  });

  it('registers an existing library PDF without copying it', async () => {
    const libraryRoot = path.join(tempDir, 'library');
    const sourcePath = path.join(libraryRoot, 'logic', 'existing.pdf');
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');

    const paper = await createPaperFromPdf({
      libraryRoot,
      sourcePath,
      title: 'Existing paper',
      directoryPath: 'papers'
    });

    expect(paper.pdfPath).toBe('logic/existing.pdf');
    expect(paper.directoryPath).toBe('logic');
    expect(fs.existsSync(path.join(libraryRoot, 'papers', 'existing.pdf'))).toBe(false);
  });

  it('deduplicates papers by library-relative PDF path', async () => {
    const libraryRoot = path.join(tempDir, 'library');
    const sourcePath = path.join(libraryRoot, 'logic', 'existing.pdf');
    fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');

    const first = await createPaperFromPdf({ libraryRoot, sourcePath, title: 'First title' });
    const second = await createPaperFromPdf({ libraryRoot, sourcePath, title: 'Second title' });

    expect(second.id).toBe(first.id);
    expect(second.title).toBe('First title');
  });

  it('returns import candidate details without registering a paper', async () => {
    const sourcePath = path.join(tempDir, 'source.pdf');
    const libraryRoot = path.join(tempDir, 'library');
    fs.mkdirSync(libraryRoot, { recursive: true });
    fs.writeFileSync(sourcePath, 'pdf-bytes');
    vi.mocked(dialog.showOpenDialog).mockResolvedValue({
      canceled: false,
      filePaths: [sourcePath]
    });

    await expect(selectPdfForImport({ libraryRoot })).resolves.toEqual({
      sourcePath,
      suggestedTitle: 'source',
      sourceRelativePath: undefined,
      willCopy: true,
      targetDirectoryPath: ''
    });
    expect(fs.existsSync(path.join(libraryRoot, '.tnet', 'papers', 'papers.db'))).toBe(false);
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
