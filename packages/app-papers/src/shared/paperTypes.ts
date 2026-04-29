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
}
