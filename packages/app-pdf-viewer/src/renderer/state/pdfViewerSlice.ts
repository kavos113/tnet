import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { basename } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import {
  defaultPdfDocumentViewState,
  defaultPdfViewerGlobalSettings,
  normalizePdfDocumentViewState,
  type PdfViewerGlobalSettings
} from '@tnet/app-pdf-viewer/shared/config';
import type {
  PdfDocumentViewState,
  PdfViewerDocument
} from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';

export interface PdfViewerState {
  rootPath: string;
  workspaceRoots: string[];
  fileTree: FileItem[];
  tabs: string[];
  activeIndex: number;
  documentsByPath: Record<string, PdfViewerDocument>;
  viewStateByPath: Record<string, PdfDocumentViewState>;
  settings: PdfViewerGlobalSettings;
  error?: string;
}

const initialState: PdfViewerState = {
  rootPath: '',
  workspaceRoots: [],
  fileTree: [],
  tabs: [],
  activeIndex: -1,
  documentsByPath: {},
  viewStateByPath: {},
  settings: defaultPdfViewerGlobalSettings()
};

const uniqueRoots = (roots: string[]): string[] => Array.from(new Set(roots.filter(Boolean)));

const ensureViewState = (state: PdfViewerState, path: string): void => {
  if (state.viewStateByPath[path]) return;
  state.viewStateByPath[path] = {
    ...defaultPdfDocumentViewState(),
    zoomMode: state.settings.defaultZoomMode,
    customScale: state.settings.defaultCustomScale,
    columns: state.settings.defaultColumns
  };
};

const clampActiveIndex = (state: PdfViewerState): void => {
  state.activeIndex =
    state.tabs.length === 0 ? -1 : Math.min(Math.max(state.activeIndex, 0), state.tabs.length - 1);
};

const pdfViewerSlice = createSlice({
  name: 'pdfViewer',
  initialState,
  reducers: {
    setPdfViewerSettings: (state, action: PayloadAction<PdfViewerGlobalSettings>) => {
      state.settings = action.payload;
    },
    setPdfViewerError: (state, action: PayloadAction<string | undefined>) => {
      state.error = action.payload;
    },
    setWorkspace: (
      state,
      action: PayloadAction<{ rootPath: string; fileTree: FileItem[]; workspaceRoots?: string[] }>
    ) => {
      state.rootPath = action.payload.rootPath;
      state.fileTree = action.payload.fileTree;
      state.workspaceRoots = uniqueRoots([
        ...(action.payload.workspaceRoots ?? state.workspaceRoots),
        action.payload.rootPath
      ]);
    },
    setWorkspaceRoots: (state, action: PayloadAction<string[]>) => {
      state.workspaceRoots = uniqueRoots(action.payload);
    },
    setFileTree: (state, action: PayloadAction<FileItem[]>) => {
      state.fileTree = action.payload;
    },
    openPdf: (
      state,
      action: PayloadAction<{ path: string; viewState?: Partial<PdfDocumentViewState> }>
    ) => {
      const existingIndex = state.tabs.indexOf(action.payload.path);
      if (existingIndex !== -1) {
        state.activeIndex = existingIndex;
      } else {
        state.tabs.push(action.payload.path);
        state.activeIndex = state.tabs.length - 1;
      }
      state.documentsByPath[action.payload.path] = {
        path: action.payload.path,
        displayName: basename(action.payload.path)
      };
      ensureViewState(state, action.payload.path);
      if (action.payload.viewState) {
        state.viewStateByPath[action.payload.path] = normalizePdfDocumentViewState({
          ...state.viewStateByPath[action.payload.path],
          ...action.payload.viewState
        });
      }
    },
    closePdf: (state, action: PayloadAction<number>) => {
      if (action.payload < 0 || action.payload >= state.tabs.length) return;
      const [path] = state.tabs.splice(action.payload, 1);
      delete state.documentsByPath[path];
      if (action.payload <= state.activeIndex) state.activeIndex -= 1;
      clampActiveIndex(state);
    },
    switchPdf: (state, action: PayloadAction<number>) => {
      if (action.payload < 0 || action.payload >= state.tabs.length) return;
      state.activeIndex = action.payload;
    },
    replaceSession: (
      state,
      action: PayloadAction<{
        openedFiles: string[];
        activeIndex: number;
        viewStateByPath: Record<string, PdfDocumentViewState>;
      }>
    ) => {
      state.tabs = action.payload.openedFiles;
      state.activeIndex = action.payload.activeIndex;
      state.documentsByPath = {};
      state.tabs.forEach((path) => {
        state.documentsByPath[path] = { path, displayName: basename(path) };
      });
      state.viewStateByPath = action.payload.viewStateByPath;
      clampActiveIndex(state);
    },
    updateActiveViewState: (state, action: PayloadAction<Partial<PdfDocumentViewState>>) => {
      const path = state.tabs[state.activeIndex];
      if (!path) return;
      state.viewStateByPath[path] = normalizePdfDocumentViewState({
        ...state.viewStateByPath[path],
        ...action.payload
      });
    },
    setDocumentPageCount: (state, action: PayloadAction<{ path: string; pageCount: number }>) => {
      const document = state.documentsByPath[action.payload.path];
      if (document) document.pageCount = action.payload.pageCount;
    },
    setDocumentError: (state, action: PayloadAction<{ path: string; error?: string }>) => {
      const document = state.documentsByPath[action.payload.path];
      if (document) document.error = action.payload.error;
    }
  }
});

export const {
  closePdf,
  openPdf,
  replaceSession,
  setDocumentError,
  setDocumentPageCount,
  setFileTree,
  setPdfViewerError,
  setPdfViewerSettings,
  setWorkspace,
  setWorkspaceRoots,
  switchPdf,
  updateActiveViewState
} = pdfViewerSlice.actions;
export default pdfViewerSlice.reducer;
