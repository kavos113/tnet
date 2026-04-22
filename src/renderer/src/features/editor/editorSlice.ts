import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { textByteLength } from '@shared/file/largeFile';
import { basename } from '@shared/path/pathUtils';
import type { ViewMode } from '@shared/types/viewMode';

export interface OpenFile {
  path: string;
  content: string;
  sizeBytes: number;
  isModified: boolean;
  displayName: string;
}

export interface PendingReveal {
  path: string;
  lineNumber: number;
  requestId: number;
}

interface EditorState {
  openedFiles: OpenFile[];
  activeIndex: number;
  viewMode: ViewMode;
  isPreviewOutlineVisible: boolean;
  pendingReveal: PendingReveal | null;
}

const initialState: EditorState = {
  openedFiles: [],
  activeIndex: -1,
  viewMode: 'split',
  isPreviewOutlineVisible: true,
  pendingReveal: null
};

let nextRevealRequestId = 1;

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openFile: (
      state,
      action: PayloadAction<{
        path: string;
        content: string;
        sizeBytes?: number;
      }>
    ) => {
      const existingIndex = state.openedFiles.findIndex(
        (file) => file.path === action.payload.path
      );
      if (existingIndex !== -1) {
        state.activeIndex = existingIndex;
        return;
      }

      state.openedFiles.push({
        path: action.payload.path,
        content: action.payload.content,
        sizeBytes: action.payload.sizeBytes ?? textByteLength(action.payload.content),
        isModified: false,
        displayName: basename(action.payload.path)
      });
      state.activeIndex = state.openedFiles.length - 1;
    },
    closeFile: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index < 0 || index >= state.openedFiles.length) return;

      state.openedFiles.splice(index, 1);
      if (state.openedFiles.length === 0) {
        state.activeIndex = -1;
      } else if (index <= state.activeIndex) {
        state.activeIndex = Math.max(0, state.activeIndex - 1);
      }
    },
    closeFileByPath: (state, action: PayloadAction<string>) => {
      const index = state.openedFiles.findIndex((file) => file.path === action.payload);
      if (index === -1) return;

      state.openedFiles.splice(index, 1);
      if (state.openedFiles.length === 0) {
        state.activeIndex = -1;
      } else if (index <= state.activeIndex) {
        state.activeIndex = Math.max(0, state.activeIndex - 1);
      }
    },
    switchFile: (state, action: PayloadAction<number>) => {
      if (action.payload < 0 || action.payload >= state.openedFiles.length) return;
      state.activeIndex = action.payload;
    },
    updateActiveContent: (state, action: PayloadAction<string>) => {
      if (state.activeIndex < 0 || state.activeIndex >= state.openedFiles.length) return;
      const activeFile = state.openedFiles[state.activeIndex];
      activeFile.content = action.payload;
      activeFile.sizeBytes = textByteLength(action.payload);
      activeFile.isModified = true;
    },
    markActiveSaved: (
      state,
      action: PayloadAction<{
        content: string;
      }>
    ) => {
      if (state.activeIndex < 0 || state.activeIndex >= state.openedFiles.length) return;
      const activeFile = state.openedFiles[state.activeIndex];
      activeFile.content = action.payload.content;
      activeFile.sizeBytes = textByteLength(action.payload.content);
      activeFile.isModified = false;
    },
    renameOpenedPath: (
      state,
      action: PayloadAction<{
        oldPath: string;
        newPath: string;
      }>
    ) => {
      const file = state.openedFiles.find((item) => item.path === action.payload.oldPath);
      if (!file) return;
      file.path = action.payload.newPath;
      file.displayName = basename(action.payload.newPath);
    },
    replaceOpenedFiles: (
      state,
      action: PayloadAction<{
        openedFiles: Array<{
          path: string;
          content: string;
          sizeBytes?: number;
        }>;
        activeIndex?: number;
      }>
    ) => {
      state.openedFiles = action.payload.openedFiles.map((file) => ({
        path: file.path,
        content: file.content,
        sizeBytes: file.sizeBytes ?? textByteLength(file.content),
        isModified: false,
        displayName: basename(file.path)
      }));
      state.activeIndex =
        state.openedFiles.length === 0
          ? -1
          : Math.min(action.payload.activeIndex ?? 0, state.openedFiles.length - 1);
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    togglePreviewOutline: (state) => {
      state.isPreviewOutlineVisible = !state.isPreviewOutlineVisible;
    },
    requestRevealLine: (
      state,
      action: PayloadAction<{
        path: string;
        lineNumber: number;
      }>
    ) => {
      state.pendingReveal = {
        path: action.payload.path,
        lineNumber: action.payload.lineNumber,
        requestId: nextRevealRequestId
      };
      nextRevealRequestId += 1;
    },
    clearPendingReveal: (state, action: PayloadAction<number>) => {
      if (state.pendingReveal?.requestId === action.payload) {
        state.pendingReveal = null;
      }
    }
  }
});

export const {
  openFile,
  closeFile,
  closeFileByPath,
  switchFile,
  updateActiveContent,
  markActiveSaved,
  renameOpenedPath,
  replaceOpenedFiles,
  requestRevealLine,
  clearPendingReveal,
  setViewMode,
  togglePreviewOutline
} = editorSlice.actions;
export default editorSlice.reducer;
