import { create } from 'zustand';
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
  openFile: (path: string, content: string) => void;
  closeFile: (index: number) => void;
  switchFile: (index: number) => void;
  updateActiveContent: (content: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  openedFiles: [],
  activeIndex: -1,
  viewMode: 'split',
  openFile: (path, content) =>
    set((state) => {
      const existingIndex = state.openedFiles.findIndex((file) => file.path === path);
      if (existingIndex !== -1) return { activeIndex: existingIndex };

      return {
        openedFiles: [
          ...state.openedFiles,
          {
            path,
            content,
            isModified: false,
            displayName: basename(path)
          }
        ],
        activeIndex: state.openedFiles.length
      };
    }),
  closeFile: (index) =>
    set((state) => {
      if (index < 0 || index >= state.openedFiles.length) return {};

      const openedFiles = state.openedFiles.filter((_, currentIndex) => currentIndex !== index);
      if (openedFiles.length === 0) return { openedFiles, activeIndex: -1 };
      if (index <= state.activeIndex) {
        return { openedFiles, activeIndex: Math.max(0, state.activeIndex - 1) };
      }
      return { openedFiles };
    }),
  switchFile: (index) =>
    set((state) => {
      if (index < 0 || index >= state.openedFiles.length) return {};
      return { activeIndex: index };
    }),
  updateActiveContent: (content) =>
    set((state) => {
      if (state.activeIndex < 0 || state.activeIndex >= state.openedFiles.length) return {};
      const openedFiles = state.openedFiles.map((file, index) =>
        index === state.activeIndex ? { ...file, content, isModified: true } : file
      );
      return { openedFiles };
    })
}));
