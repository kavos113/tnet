import { createRouterTransport } from '@connectrpc/connect';
import { describe, expect, it } from 'vitest';
import {
  BrowserImportService,
  HealthService,
  LibraryService,
  PaperService
} from '../src/generated/tnet/papers/v1/papers_connect';
import { PapersExtensionServerClient } from '../src/papersServerClient';

const createAvailableClient = (): PapersExtensionServerClient => {
  const transport = createRouterTransport((router) => {
    router.service(HealthService, {
      check: () => ({ status: 'ok', version: 'test' })
    });
    router.service(LibraryService, {
      listLibraries: () => ({
        libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
        activeLibraryRoot: 'C:/papers'
      }),
      listDirectories: () => ({
        root: {
          name: 'papers',
          relativePath: '',
          children: [{ name: 'articles', relativePath: 'articles', children: [] }]
        }
      })
    });
    router.service(BrowserImportService, {
      resolveMetadata: (request) => ({
        source: request.source,
        title: request.source?.title || request.source?.pageTitle || '',
        doi: request.source?.doi ?? '',
        pdfUrl: request.source?.pdfUrl ?? ''
      })
    });
    router.service(PaperService, {
      importBrowserPaper: () => ({ status: 'created', paper: { id: 'paper-1', title: 'Paper' } })
    });
  });
  return new PapersExtensionServerClient({ transport });
};

describe('PapersExtensionServerClient', () => {
  it('returns false when health check cannot reach the server', async () => {
    const transport = createRouterTransport((router) => {
      router.service(HealthService, {
        check: async () => {
          throw new Error('offline');
        }
      });
    });
    const client = new PapersExtensionServerClient({ transport });

    await expect(client.checkHealth()).resolves.toBe(false);
  });

  it('loads libraries from the generated LibraryService client', async () => {
    const client = createAvailableClient();

    await expect(client.listLibraries()).resolves.toEqual({
      libraries: [{ rootPath: 'C:/papers', name: 'papers', isActive: true }],
      activeLibraryRoot: 'C:/papers'
    });
  });

  it('loads directories from the generated LibraryService client', async () => {
    const client = createAvailableClient();

    await expect(client.listDirectories('C:/papers')).resolves.toEqual({
      name: 'papers',
      relativePath: '',
      children: [{ name: 'articles', relativePath: 'articles', children: [] }]
    });
  });

  it('resolves metadata through the generated BrowserImportService client', async () => {
    const client = createAvailableClient();

    await expect(
      client.resolveMetadata({
        sourceUrl: 'https://example.test',
        pageTitle: 'Page',
        title: 'Paper',
        doi: '10.1000/example',
        pdfUrl: 'https://example.test/paper.pdf'
      })
    ).resolves.toMatchObject({
      title: 'Paper',
      doi: '10.1000/example',
      pdfUrl: 'https://example.test/paper.pdf'
    });
  });

  it('imports a paper through the generated PaperService client', async () => {
    const client = createAvailableClient();

    await expect(
      client.importPaper({
        libraryRoot: 'C:/papers',
        directoryPath: 'articles',
        candidate: { title: 'Paper' },
        importPdf: true,
        tags: ['ai']
      })
    ).resolves.toMatchObject({ status: 'created', paper: { id: 'paper-1' } });
  });
});
