import { createRouterTransport } from '@connectrpc/connect';
import { describe, expect, it } from 'vitest';
import {
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
    router.service(PaperService, {
      createPaperFromPdfBytes: () => ({ id: 'paper-1', title: 'Paper', hasPdf: true })
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

  it('imports manually selected PDF bytes through the generated PaperService client', async () => {
    const client = createAvailableClient();

    await expect(
      client.createPaperFromPdfBytes({
        libraryRoot: 'C:/papers',
        directoryPath: 'articles',
        fileName: 'paper.pdf',
        pdfBytes: new Uint8Array([1, 2, 3]),
        metadata: { title: 'Paper', authors: ['Alice'] }
      })
    ).resolves.toMatchObject({ id: 'paper-1', title: 'Paper' });
  });
});
