import { defaultPdfDocumentViewState, normalizePdfDocumentViewState } from './config';
import type { PdfDocumentViewState } from './pdfViewerTypes';

export interface PdfViewerExplorerSession {
  expandedFolders: string[];
  selectedPath?: string;
}

export interface PdfViewerSession {
  openedFiles: string[];
  activeIndex: number;
  viewStateByPath: Record<string, PdfDocumentViewState>;
}

export interface PdfViewerSessionData {
  explorer: PdfViewerExplorerSession;
  apps: {
    pdfViewer: PdfViewerSession;
  };
}

export const emptyPdfViewerSessionData = (): PdfViewerSessionData => ({
  explorer: {
    expandedFolders: []
  },
  apps: {
    pdfViewer: {
      openedFiles: [],
      activeIndex: -1,
      viewStateByPath: {}
    }
  }
});

export const normalizePdfViewerSessionData = (session: unknown): PdfViewerSessionData => {
  if (!session || typeof session !== 'object' || Array.isArray(session)) {
    return emptyPdfViewerSessionData();
  }
  const candidate = session as Partial<PdfViewerSessionData>;
  const explorer = (candidate.explorer ?? {}) as Partial<PdfViewerExplorerSession>;
  const pdfViewer = (candidate.apps?.pdfViewer ?? {}) as Partial<PdfViewerSession>;
  const openedFiles = Array.isArray(pdfViewer.openedFiles)
    ? pdfViewer.openedFiles.filter((path): path is string => typeof path === 'string')
    : [];
  const activeIndex =
    typeof pdfViewer.activeIndex === 'number'
      ? Math.min(Math.max(Math.round(pdfViewer.activeIndex), -1), openedFiles.length - 1)
      : openedFiles.length > 0
        ? 0
        : -1;

  return {
    explorer: {
      expandedFolders: Array.isArray(explorer.expandedFolders)
        ? explorer.expandedFolders.filter((path): path is string => typeof path === 'string')
        : [],
      selectedPath: typeof explorer.selectedPath === 'string' ? explorer.selectedPath : undefined
    },
    apps: {
      pdfViewer: {
        openedFiles,
        activeIndex,
        viewStateByPath: normalizeViewStateMap(pdfViewer.viewStateByPath)
      }
    }
  };
};

const normalizeViewStateMap = (value: unknown): Record<string, PdfDocumentViewState> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.entries(value).reduce<Record<string, PdfDocumentViewState>>(
    (states, [path, state]) => {
      states[path] = normalizePdfDocumentViewState(state, defaultPdfDocumentViewState());
      return states;
    },
    {}
  );
};
