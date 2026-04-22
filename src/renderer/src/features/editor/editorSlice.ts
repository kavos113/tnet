import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { basename } from '@shared/path/pathUtils';
import type { ViewMode } from '@shared/types/viewMode';

export interface OpenFile {
  path: string;
  content: string;
  isModified: boolean;
  displayName: string;
}

interface EditorState {
  openedFiles: OpenFile[];
  activeIndex: number;
  viewMode: ViewMode;
  isPreviewOutlineVisible: boolean;
}

const initialState: EditorState = {
  openedFiles: [],
  activeIndex: -1,
  viewMode: 'split',
  isPreviewOutlineVisible: true
};

const editorSlice = createSlice({
  name: 'editor',
  initialState,
  reducers: {
    openFile: (
      state,
      action: PayloadAction<{
        path: string;
        content: string;
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
        }>;
        activeIndex?: number;
      }>
    ) => {
      state.openedFiles = action.payload.openedFiles.map((file) => ({
        path: file.path,
        content: file.content,
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
  setViewMode,
  togglePreviewOutline
} = editorSlice.actions;
export default editorSlice.reducer;
