import { defineStore } from 'pinia';
import { ViewMode } from '@fixtures/viewMode';

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
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => {
    return {
      openedFiles: [],
      activeIndex: -1,
      viewMode: 'split'
    };
  }
});
