import { createClient, type Client, type Transport } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import {
  HealthService,
  LibraryService,
  PaperService
} from './generated/tnet/papers/v1/papers_connect';
import type { DirectoryNode as GeneratedDirectoryNode } from './generated/tnet/papers/v1/papers_pb';
import type { CreatePaperFromPdfBytesRequest, DirectoryNode, LibraryInfo } from './types';

export interface PapersExtensionServerClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  transport?: Transport;
}

export class PapersExtensionServerClient {
  private readonly healthClient: Client<typeof HealthService>;
  private readonly libraryClient: Client<typeof LibraryService>;
  private readonly paperClient: Client<typeof PaperService>;

  constructor({
    baseUrl = 'http://127.0.0.1:38911',
    fetchImpl = fetch,
    transport
  }: PapersExtensionServerClientOptions = {}) {
    const rpcTransport =
      transport ??
      createConnectTransport({ baseUrl: baseUrl.replace(/\/+$/g, ''), fetch: fetchImpl });
    this.healthClient = createClient(HealthService, rpcTransport);
    this.libraryClient = createClient(LibraryService, rpcTransport);
    this.paperClient = createClient(PaperService, rpcTransport);
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.healthClient.check({});
      return response.status === 'ok';
    } catch {
      return false;
    }
  }

  async listLibraries(): Promise<{ libraries: LibraryInfo[]; activeLibraryRoot?: string }> {
    const response = await this.libraryClient.listLibraries({});
    return {
      libraries: response.libraries.map((library) => ({
        rootPath: library.rootPath,
        name: library.name,
        isActive: library.isActive
      })),
      activeLibraryRoot: response.activeLibraryRoot || undefined
    };
  }

  async listDirectories(libraryRoot: string): Promise<DirectoryNode | null> {
    const response = await this.libraryClient.listDirectories({ libraryRoot });
    return response.root ? toDirectoryNode(response.root) : null;
  }

  async createPaperFromPdfBytes(request: CreatePaperFromPdfBytesRequest): Promise<unknown> {
    const response = await this.paperClient.createPaperFromPdfBytes({
      libraryRoot: request.libraryRoot,
      directoryPath: request.directoryPath ?? '',
      fileName: request.fileName,
      pdfBytes: request.pdfBytes,
      title: request.metadata.title ?? request.fileName.replace(/\.pdf$/i, ''),
      authors: request.metadata.authors ?? [],
      abstract: request.metadata.abstract ?? '',
      publishedYear: request.metadata.publishedYear ?? 0,
      venue: request.metadata.venue ?? '',
      doi: request.metadata.doi ?? '',
      arxivId: request.metadata.arxivId ?? '',
      url: request.metadata.url ?? ''
    });
    return response;
  }
}

const toDirectoryNode = (node: GeneratedDirectoryNode): DirectoryNode => ({
  name: node.name,
  relativePath: node.relativePath,
  children: node.children.map(toDirectoryNode)
});
