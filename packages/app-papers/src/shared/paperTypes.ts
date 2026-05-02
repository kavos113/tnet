export interface PaperTag {
  id: string;
  name: string;
  color?: string;
}

export interface PaperSummary {
  id: string;
  title: string;
  authors: string[];
  publishedYear?: number;
  venue?: string;
  tags: string[];
  hasPdf: boolean;
}

export interface PaperDetail extends PaperSummary {
  abstract?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
  pdfPath?: string;
  directoryPath: string;
  noteContent: string;
  aiOutputs?: PaperAiOutput[];
}

export type PaperAiOperation = 'translate' | 'summary';
export type PaperAiInputMode = 'pdf-direct' | 'text';

export interface PaperAiOutput {
  paperId: string;
  operation: PaperAiOperation;
  inputMode: PaperAiInputMode;
  targetLanguage: string;
  provider: string;
  model: string;
  content: string;
  updatedAt: string;
}
