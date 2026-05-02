import * as grpc from '@grpc/grpc-js';
import {
  defaultPapersLibraryConfig,
  type PapersGlobalConfig,
  type PapersLibraryConfig
} from '@tnet/app-papers/shared/config';
import type {
  CreatePaperFromPdfBytesRequest,
  CreatePaperFromPdfRequest,
  ListPapersRequest
} from '@tnet/app-papers/shared/ipc';
import type {
  PaperAiInputMode,
  PaperAiOperation,
  PaperAiOutput,
  PaperDetail,
  PaperSummary,
  PaperTag
} from '@tnet/app-papers/shared/paperTypes';
import {
  LibraryServiceClient,
  PaperServiceClient,
  PdfServiceClient,
  TagServiceClient,
  type ILibraryServiceClient,
  type IPaperServiceClient,
  type IPdfServiceClient,
  type ITagServiceClient
} from '@tnet/app-papers/main/generated/tnet/papers/v1/papers.grpc-client';
import type {
  PaperDetail as GeneratedPaperDetail,
  PaperAiOutput as GeneratedPaperAiOutput,
  PaperTag as GeneratedPaperTag
} from '@tnet/app-papers/main/generated/tnet/papers/v1/papers';

export interface PapersServerClientOptions {
  baseUrl?: string;
  clients?: PapersServerGrpcClients;
  userDataDir: string;
}

export interface PapersServerGrpcClients {
  libraryClient: ILibraryServiceClient;
  paperClient: IPaperServiceClient;
  pdfClient: IPdfServiceClient;
  tagClient: ITagServiceClient;
}

export class PapersServerClient {
  private readonly libraryClient: ILibraryServiceClient;
  private readonly paperClient: IPaperServiceClient;
  private readonly pdfClient: IPdfServiceClient;
  private readonly tagClient: ITagServiceClient;
  private readonly userDataDir: string;

  constructor({
    baseUrl = 'http://127.0.0.1:38911',
    clients,
    userDataDir
  }: PapersServerClientOptions) {
    const grpcClients = clients ?? createGrpcClients(baseUrl);
    this.libraryClient = grpcClients.libraryClient;
    this.paperClient = grpcClients.paperClient;
    this.pdfClient = grpcClients.pdfClient;
    this.tagClient = grpcClients.tagClient;
    this.userDataDir = userDataDir;
  }

  async loadGlobalConfig(): Promise<PapersGlobalConfig> {
    const config = await unary(this.libraryClient.loadGlobalConfig.bind(this.libraryClient), {
      userDataDir: this.userDataDir
    });
    return {
      libraryRoots: config.libraryRoots,
      activeLibraryRoot: config.activeLibraryRoot || undefined,
      lastOpenedDirectory: config.lastOpenedDirectory || undefined
    };
  }

  async saveGlobalConfig(config: PapersGlobalConfig): Promise<void> {
    await unary(this.libraryClient.saveGlobalConfig.bind(this.libraryClient), {
      userDataDir: this.userDataDir,
      config: {
        libraryRoots: config.libraryRoots,
        activeLibraryRoot: config.activeLibraryRoot ?? '',
        lastOpenedDirectory: config.lastOpenedDirectory ?? ''
      }
    });
  }

  async loadLibraryConfig(libraryRoot: string): Promise<PapersLibraryConfig> {
    if (!libraryRoot) return defaultPapersLibraryConfig();

    const config = await unary(this.libraryClient.loadLibraryConfig.bind(this.libraryClient), {
      libraryRoot
    });
    return {
      listDensity: (config.listDensity || 'comfortable') as PapersLibraryConfig['listDensity'],
      pdfZoomMode: (config.pdfZoomMode || 'page-width') as PapersLibraryConfig['pdfZoomMode'],
      noteEditorMode: (config.noteEditorMode || 'split') as PapersLibraryConfig['noteEditorMode'],
      noteAutoSaveDebounceMs: config.noteAutoSaveDebounceMs || 500,
      noteEditorFontFamily: config.noteEditorFontFamily || 'monospace',
      noteEditorFontSize: config.noteEditorFontSize || 16,
      notePreviewFontFamily: config.notePreviewFontFamily || 'sans-serif',
      notePreviewFontSize: config.notePreviewFontSize || 16
    };
  }

  async saveLibraryConfig(libraryRoot: string, config: PapersLibraryConfig): Promise<void> {
    if (!libraryRoot) return;

    await unary(this.libraryClient.saveLibraryConfig.bind(this.libraryClient), {
      libraryRoot,
      config: {
        ...config,
        noteAutoSaveDebounceMs: config.noteAutoSaveDebounceMs,
        noteEditorFontSize: config.noteEditorFontSize,
        notePreviewFontSize: config.notePreviewFontSize
      }
    });
  }

  async listPapers(request: ListPapersRequest): Promise<PaperSummary[]> {
    if (!request.libraryRoot) return [];

    const response = await unary(this.paperClient.listPapers.bind(this.paperClient), {
      libraryRoot: request.libraryRoot,
      directoryPath: request.directoryPath ?? '',
      query: request.query ?? '',
      tagIds: request.tagIds ?? []
    });
    return response.papers.map(toPaperSummary);
  }

  async getPaper(request: { libraryRoot: string; paperId: string }): Promise<PaperDetail | null> {
    if (!request.libraryRoot || !request.paperId) return null;

    const response = await unary(this.paperClient.getPaper.bind(this.paperClient), request);
    return response.paper ? toPaperDetail(response.paper) : null;
  }

  async createPaperFromPdf(request: CreatePaperFromPdfRequest): Promise<PaperDetail> {
    const response = await unary(this.paperClient.createPaperFromLocalPdf.bind(this.paperClient), {
      libraryRoot: request.libraryRoot,
      sourcePath: request.sourcePath,
      title: request.title,
      authors: request.authors ?? [],
      abstract: request.abstract ?? '',
      publishedYear: request.publishedYear ?? 0,
      venue: request.venue ?? '',
      doi: request.doi ?? '',
      arxivId: request.arxivId ?? '',
      url: request.url ?? '',
      directoryPath: request.directoryPath ?? '',
      tags: request.tags ?? []
    });
    return toPaperDetail(requireImportedPaper(response.paper));
  }

  async createPaperFromPdfBytes(request: CreatePaperFromPdfBytesRequest): Promise<PaperDetail> {
    const response = await unary(this.paperClient.createPaperFromPdfBytes.bind(this.paperClient), {
      libraryRoot: request.libraryRoot,
      fileName: request.fileName,
      pdfBytes: request.pdfBytes,
      title: request.title,
      authors: request.authors ?? [],
      abstract: request.abstract ?? '',
      publishedYear: request.publishedYear ?? 0,
      venue: request.venue ?? '',
      doi: request.doi ?? '',
      arxivId: request.arxivId ?? '',
      url: request.url ?? '',
      directoryPath: request.directoryPath ?? '',
      tags: request.tags ?? []
    });
    return toPaperDetail(requireImportedPaper(response.paper));
  }

  async listTags(request: { libraryRoot: string }): Promise<PaperTag[]> {
    if (!request.libraryRoot) return [];

    const response = await unary(this.tagClient.listTags.bind(this.tagClient), request);
    return response.tags.map(toPaperTag);
  }

  async upsertTag(request: {
    libraryRoot: string;
    name: string;
    color?: string;
  }): Promise<PaperTag> {
    const response = await unary(this.tagClient.upsertTag.bind(this.tagClient), {
      libraryRoot: request.libraryRoot,
      name: request.name,
      color: request.color ?? ''
    });
    return toPaperTag(response);
  }

  async attachTag(request: {
    libraryRoot: string;
    paperId: string;
    tagId: string;
  }): Promise<PaperDetail | null> {
    if (!request.libraryRoot || !request.paperId || !request.tagId) return null;

    const response = await unary(this.tagClient.attachTag.bind(this.tagClient), request);
    return response.paper ? toPaperDetail(response.paper) : null;
  }

  async detachTag(request: {
    libraryRoot: string;
    paperId: string;
    tagId: string;
  }): Promise<PaperDetail | null> {
    if (!request.libraryRoot || !request.paperId || !request.tagId) return null;

    const response = await unary(this.tagClient.detachTag.bind(this.tagClient), request);
    return response.paper ? toPaperDetail(response.paper) : null;
  }

  async saveNote(request: {
    libraryRoot: string;
    paperId: string;
    content: string;
  }): Promise<PaperDetail | null> {
    if (!request.libraryRoot || !request.paperId) return null;

    const response = await unary(this.paperClient.saveNote.bind(this.paperClient), request);
    return response.paper ? toPaperDetail(response.paper) : null;
  }

  async listPaperAiOutputs(request: {
    libraryRoot: string;
    paperId: string;
  }): Promise<PaperAiOutput[]> {
    if (!request.libraryRoot || !request.paperId) return [];
    const response = await unary(
      this.paperClient.listPaperAiOutputs.bind(this.paperClient),
      request
    );
    return response.outputs.map(toPaperAiOutput);
  }

  async savePaperAiOutput(request: {
    libraryRoot: string;
    output: PaperAiOutput;
  }): Promise<PaperAiOutput> {
    const response = await unary(this.paperClient.savePaperAiOutput.bind(this.paperClient), {
      libraryRoot: request.libraryRoot,
      output: fromPaperAiOutput(request.output)
    });
    return toPaperAiOutput(response);
  }

  async loadPdfBytes(request: { libraryRoot: string; pdfPath: string }): Promise<ArrayBuffer> {
    const response = await unary(this.pdfClient.loadPdfBytes.bind(this.pdfClient), request);
    return new Uint8Array(response.bytes).buffer;
  }
}

export const createPapersServerClient = (options: PapersServerClientOptions): PapersServerClient =>
  new PapersServerClient(options);

const createGrpcClients = (baseUrl: string): PapersServerGrpcClients => {
  const address = toGrpcAddress(baseUrl);
  const credentials = grpc.credentials.createInsecure();
  return {
    libraryClient: new LibraryServiceClient(address, credentials),
    paperClient: new PaperServiceClient(address, credentials),
    pdfClient: new PdfServiceClient(address, credentials),
    tagClient: new TagServiceClient(address, credentials)
  };
};

const toGrpcAddress = (baseUrl: string): string => {
  if (!baseUrl.includes('://')) return baseUrl.replace(/\/+$/g, '');

  const url = new URL(baseUrl);
  return url.port ? `${url.hostname}:${url.port}` : url.hostname;
};

type UnaryCallback<Output> = (err: grpc.ServiceError | null, value?: Output) => void;
type UnaryMethod<Input, Output> = (
  input: Input,
  callback: UnaryCallback<Output>
) => grpc.ClientUnaryCall;

const unary = <Input, Output>(method: UnaryMethod<Input, Output>, input: Input): Promise<Output> =>
  new Promise((resolve, reject) => {
    method(input, (err, value) => {
      if (err) {
        reject(err);
        return;
      }

      if (value === undefined) {
        reject(new Error('gRPC response was empty'));
        return;
      }

      resolve(value);
    });
  });

interface GeneratedPaperSummaryLike {
  id: string;
  title: string;
  authors: string[];
  publishedYear: number;
  venue: string;
  tags: string[];
  hasPdf: boolean;
}

const toPaperSummary = (paper: GeneratedPaperSummaryLike): PaperSummary => ({
  id: paper.id,
  title: paper.title,
  authors: paper.authors,
  publishedYear: paper.publishedYear === 0 ? undefined : paper.publishedYear,
  venue: paper.venue || undefined,
  tags: paper.tags,
  hasPdf: paper.hasPdf
});

const toPaperDetail = (paper: GeneratedPaperDetail): PaperDetail => ({
  ...toPaperSummary(paper),
  abstract: paper.abstract || undefined,
  doi: paper.doi || undefined,
  arxivId: paper.arxivId || undefined,
  url: paper.url || undefined,
  pdfPath: paper.pdfPath || undefined,
  directoryPath: paper.directoryPath,
  noteContent: paper.noteContent,
  aiOutputs: (paper.aiOutputs ?? []).map(toPaperAiOutput)
});

const toPaperAiOutput = (output: GeneratedPaperAiOutput): PaperAiOutput => ({
  paperId: output.paperId,
  operation: output.operation as PaperAiOperation,
  inputMode: output.inputMode as PaperAiInputMode,
  targetLanguage: output.targetLanguage,
  provider: output.provider,
  model: output.model,
  content: output.content,
  updatedAt: output.updatedAt
});

const fromPaperAiOutput = (output: PaperAiOutput): GeneratedPaperAiOutput => ({
  paperId: output.paperId,
  operation: output.operation,
  inputMode: output.inputMode,
  targetLanguage: output.targetLanguage,
  provider: output.provider,
  model: output.model,
  content: output.content,
  updatedAt: output.updatedAt
});

const toPaperTag = (tag: GeneratedPaperTag): PaperTag => ({
  id: tag.id,
  name: tag.name,
  color: tag.color || undefined
});

const requireImportedPaper = (paper: GeneratedPaperDetail | undefined): GeneratedPaperDetail => {
  if (!paper) {
    throw new Error('gRPC import response was empty');
  }
  return paper;
};
