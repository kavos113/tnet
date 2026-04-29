import { describe, expect, it, vi } from 'vitest';
import {
  flattenDirectoryTree,
  importSelectedPaper,
  loadPopupState,
  parseTagsInput,
  resolveInitialLibraryRoot,
  selectLibrary
} from '../src/popup/popupStore';

describe('loadPopupState', () => {
  it('shows retryable unavailable state when backend is not running', async () => {
    const client = {
      checkHealth: vi.fn(async () => false)
    };

    await expect(
      loadPopupState(client as never, { sourceUrl: 'https://example.test' })
    ).resolves.toMatchObject({
      status: 'server-unavailable',
      errorMessage: 'TNet desktop app is not running.'
    });
  });

  it('loads libraries and normalized metadata when backend is available', async () => {
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
      })),
      resolveMetadata: vi.fn(async () => ({
        title: 'Paper',
        pdfUrl: 'https://example.test/paper.pdf',
        tags: ['ai']
      }))
    };

    await expect(
      loadPopupState(client as never, { sourceUrl: 'https://example.test' })
    ).resolves.toMatchObject({
      status: 'ready',
      libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
      activeLibraryRoot: 'C:/papers',
      selectedLibraryRoot: 'C:/papers',
      selectedDirectoryPath: '',
      candidate: { title: 'Paper' },
      importPdf: true,
      tagsInput: 'ai'
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
          importPdf: false,
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

  it('imports the selected candidate with library, directory, pdf flag, and tags', async () => {
    const client = {
      importPaper: vi.fn(async () => ({ status: 'created', paper: { id: 'paper-1' } }))
    };

    await expect(
      importSelectedPaper(client as never, {
        status: 'ready',
        libraries: [],
        selectedLibraryRoot: 'C:/papers',
        selectedDirectoryPath: 'articles',
        candidate: { title: 'Paper', pdfUrl: 'https://example.test/paper.pdf' },
        importPdf: true,
        tagsInput: 'ai, retrieval'
      })
    ).resolves.toMatchObject({
      status: 'imported',
      importResult: { status: 'created', paper: { id: 'paper-1' } }
    });
    expect(client.importPaper).toHaveBeenCalledWith({
      libraryRoot: 'C:/papers',
      directoryPath: 'articles',
      candidate: { title: 'Paper', pdfUrl: 'https://example.test/paper.pdf' },
      importPdf: true,
      tags: ['ai', 'retrieval']
    });
  });
});
