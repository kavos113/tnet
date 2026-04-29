import { createClient, type Client, type Transport } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import type { PartialMessage } from '@bufbuild/protobuf';
import {
  BrowserImportService,
  HealthService,
  LibraryService,
  PaperService
} from './generated/tnet/papers/v1/papers_connect';
import type {
  BrowserDetectedPaperSource as GeneratedBrowserDetectedPaperSource,
  BrowserPaperImportCandidate as GeneratedBrowserPaperImportCandidate,
  DirectoryNode as GeneratedDirectoryNode
} from './generated/tnet/papers/v1/papers_pb';
import type {
  BrowserDetectedPaperSource,
  BrowserPaperImportCandidate,
  DirectoryNode,
  ImportBrowserPaperProgress,
  ImportBrowserPaperRequest,
  ImportBrowserPaperResponse,
  LibraryInfo
} from './types';

export interface PapersExtensionServerClientOptions {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  transport?: Transport;
}

export class PapersExtensionServerClient {
  private readonly browserImportClient: Client<typeof BrowserImportService>;
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
    this.browserImportClient = createClient(BrowserImportService, rpcTransport);
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

  async resolveMetadata(source: BrowserDetectedPaperSource): Promise<BrowserPaperImportCandidate> {
    const response = await this.browserImportClient.resolveMetadata({
      source: toGeneratedSource(source)
    });
    return toBrowserPaperImportCandidate(response);
  }

  async importPaper(request: ImportBrowserPaperRequest): Promise<ImportBrowserPaperResponse> {
    const response = await this.paperClient.importBrowserPaper({
      libraryRoot: request.libraryRoot,
      directoryPath: request.directoryPath ?? '',
      candidate: toGeneratedCandidate(request.candidate),
      importPdf: request.importPdf,
      tags: request.tags ?? []
    });
    return {
      status: response.status,
      paper: response.paper
    };
  }

  async importPaperWithProgress(
    request: ImportBrowserPaperRequest,
    onProgress: (progress: ImportBrowserPaperProgress) => void
  ): Promise<ImportBrowserPaperResponse> {
    let result: ImportBrowserPaperResponse | undefined;
    for await (const progress of this.paperClient.importBrowserPaperWithProgress({
      libraryRoot: request.libraryRoot,
      directoryPath: request.directoryPath ?? '',
      candidate: toGeneratedCandidate(request.candidate),
      importPdf: request.importPdf,
      tags: request.tags ?? []
    })) {
      const mapped = toImportBrowserPaperProgress(progress);
      onProgress(mapped);
      if (mapped.response) {
        result = mapped.response;
      }
    }
    if (!result) {
      throw new Error('Paper import completed without a final response.');
    }
    return result;
  }
}

const toGeneratedSource = (
  source: BrowserDetectedPaperSource
): PartialMessage<GeneratedBrowserDetectedPaperSource> => ({
  sourceUrl: source.sourceUrl,
  pageTitle: source.pageTitle ?? '',
  canonicalUrl: source.canonicalUrl ?? '',
  doi: source.doi ?? '',
  arxivId: source.arxivId ?? '',
  pdfUrl: source.pdfUrl ?? '',
  title: source.title ?? '',
  authors: source.authors ?? [],
  publishedYear: source.publishedYear ?? 0,
  venue: source.venue ?? ''
});

const toGeneratedCandidate = (
  candidate: BrowserPaperImportCandidate
): PartialMessage<GeneratedBrowserPaperImportCandidate> => ({
  source: candidate.source ? toGeneratedSource(candidate.source) : undefined,
  title: candidate.title ?? '',
  authors: candidate.authors ?? [],
  abstract: candidate.abstract ?? '',
  publishedYear: candidate.publishedYear ?? 0,
  venue: candidate.venue ?? '',
  doi: candidate.doi ?? '',
  arxivId: candidate.arxivId ?? '',
  pdfUrl: candidate.pdfUrl ?? '',
  tags: candidate.tags ?? []
});

const toBrowserPaperImportCandidate = (
  candidate: GeneratedBrowserPaperImportCandidate
): BrowserPaperImportCandidate => ({
  source: candidate.source ? toBrowserDetectedPaperSource(candidate.source) : undefined,
  title: candidate.title || undefined,
  authors: candidate.authors,
  abstract: candidate.abstract || undefined,
  publishedYear: candidate.publishedYear === 0 ? undefined : candidate.publishedYear,
  venue: candidate.venue || undefined,
  doi: candidate.doi || undefined,
  arxivId: candidate.arxivId || undefined,
  pdfUrl: candidate.pdfUrl || undefined,
  tags: candidate.tags
});

const toBrowserDetectedPaperSource = (
  source: GeneratedBrowserDetectedPaperSource
): BrowserDetectedPaperSource => ({
  sourceUrl: source.sourceUrl,
  pageTitle: source.pageTitle || undefined,
  canonicalUrl: source.canonicalUrl || undefined,
  doi: source.doi || undefined,
  arxivId: source.arxivId || undefined,
  pdfUrl: source.pdfUrl || undefined,
  title: source.title || undefined,
  authors: source.authors,
  publishedYear: source.publishedYear === 0 ? undefined : source.publishedYear,
  venue: source.venue || undefined
});

const toDirectoryNode = (node: GeneratedDirectoryNode): DirectoryNode => ({
  name: node.name,
  relativePath: node.relativePath,
  children: node.children.map(toDirectoryNode)
});

const toImportBrowserPaperProgress = (progress: {
  stage: string;
  message: string;
  downloadedBytes: bigint | number | string;
  totalBytes: bigint | number | string;
  response?: { status: string; paper?: unknown };
}): ImportBrowserPaperProgress => ({
  stage: progress.stage,
  message: progress.message || undefined,
  downloadedBytes: Number(progress.downloadedBytes),
  totalBytes: Number(progress.totalBytes),
  response: progress.response
    ? {
        status: progress.response.status,
        paper: progress.response.paper
      }
    : undefined
});
