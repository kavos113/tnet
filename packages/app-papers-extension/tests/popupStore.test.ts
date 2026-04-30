import { describe, expect, it, vi } from 'vitest';
import {
  flattenDirectoryTree,
  importSelectedPaper,
  loadPopupState,
  parseTagsInput,
  resolveInitialLibraryRoot,
  selectLibrary,
  updateBibtexInput
} from '../src/popup/popupStore';

describe('popupStore', () => {
  it('shows retryable unavailable state when backend is not running', async () => {
    const client = {
      checkHealth: vi.fn(async () => false)
    };

    await expect(loadPopupState(client as never)).resolves.toMatchObject({
      status: 'server-unavailable',
      errorMessage: 'TNet desktop app is not running.'
    });
  });

  it('loads libraries and directories when backend is available', async () => {
    const client = {
      checkHealth: vi.fn(async () => true),
      listLibraries: vi.fn(async () => ({
        libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
        activeLibraryRoot: 'C:/papers'
      })),
      listDirectories: vi.fn(async () => ({
        name: 'papers',
        relativePath: '',
        children: [{ name: 'articles', relativePath: 'articles', children: [] }]
      }))
    };

    await expect(loadPopupState(client as never)).resolves.toMatchObject({
      status: 'ready',
      libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
      activeLibraryRoot: 'C:/papers',
      selectedLibraryRoot: 'C:/papers',
      selectedDirectoryPath: ''
    });
    expect(client.listDirectories).toHaveBeenCalledWith('C:/papers');
  });

  it('uses the first library when there is no active library', () => {
    expect(
      resolveInitialLibraryRoot(
        [
          { rootPath: 'C:/first', name: 'first', isActive: false },
          { rootPath: 'C:/second', name: 'second', isActive: false }
        ],
        undefined
      )
    ).toBe('C:/first');
  });

  it('flattens a directory tree for select options', () => {
    expect(
      flattenDirectoryTree({
        name: 'papers',
        relativePath: '',
        children: [
          {
            name: 'articles',
            relativePath: 'articles',
            children: [{ name: '2026', relativePath: 'articles/2026', children: [] }]
          }
        ]
      })
    ).toEqual([
      { value: '', label: '/' },
      { value: 'articles', label: 'articles' },
      { value: 'articles/2026', label: 'articles/2026' }
    ]);
  });

  it('parses comma separated tags', () => {
    expect(parseTagsInput(' ai, retrieval ,, llm ')).toEqual(['ai', 'retrieval', 'llm']);
  });

  it('loads directories when the selected library changes', async () => {
    const client = {
      listDirectories: vi.fn(async () => ({
        name: 'second',
        relativePath: '',
        children: [{ name: 'inbox', relativePath: 'inbox', children: [] }]
      }))
    };

    await expect(
      selectLibrary(
        client as never,
        {
          status: 'ready',
          libraries: [],
          selectedLibraryRoot: 'C:/first',
          selectedDirectoryPath: 'articles',
          directoryTree: null,
          bibtexInput: '',
          bibtexDiagnostics: [],
          metadata: {},
          tagsInput: ''
        },
        'C:/second'
      )
    ).resolves.toMatchObject({
      selectedLibraryRoot: 'C:/second',
      selectedDirectoryPath: '',
      directoryTree: { children: [{ relativePath: 'inbox' }] }
    });
  });

  it('updates metadata from pasted BibTeX', () => {
    expect(
      updateBibtexInput(
        {
          status: 'ready',
          libraries: [],
          bibtexInput: '',
          bibtexDiagnostics: [],
          metadata: {},
          tagsInput: ''
        },
        '@article{paper,title={Paper},author={Alice and Bob},year={2025}}'
      )
    ).toMatchObject({
      bibtexDiagnostics: [],
      metadata: {
        title: 'Paper',
        authors: ['Alice', 'Bob'],
        publishedYear: 2025
      }
    });
  });

  it('stores BibTeX parse diagnostics', () => {
    expect(
      updateBibtexInput(
        {
          status: 'ready',
          libraries: [],
          bibtexInput: '',
          metadata: {},
          bibtexDiagnostics: [],
          tagsInput: ''
        },
        'not bibtex'
      )
    ).toMatchObject({
      metadata: {},
      bibtexDiagnostics: [{ severity: 'error', message: 'BibTeX entry must start with @.' }]
    });
  });

  it('imports selected PDF bytes with parsed metadata', async () => {
    const client = {
      createPaperFromPdfBytes: vi.fn(async () => ({ id: 'paper-1', title: 'Paper' }))
    };

    await expect(
      importSelectedPaper(
        client as never,
        {
          status: 'ready',
          libraries: [],
          selectedLibraryRoot: 'C:/papers',
          selectedDirectoryPath: 'articles',
          bibtexInput: '',
          bibtexDiagnostics: [],
          metadata: { title: 'Paper', authors: ['Alice'] },
          tagsInput: 'ai'
        },
        { name: 'paper.pdf', bytes: new Uint8Array([1, 2, 3]) }
      )
    ).resolves.toMatchObject({
      status: 'imported',
      importResult: { id: 'paper-1', title: 'Paper' }
    });
    expect(client.createPaperFromPdfBytes).toHaveBeenCalledWith({
      libraryRoot: 'C:/papers',
      directoryPath: 'articles',
      fileName: 'paper.pdf',
      pdfBytes: new Uint8Array([1, 2, 3]),
      metadata: { title: 'Paper', authors: ['Alice'] }
    });
  });
});
