import { defineStore } from 'pinia';
import { ViewMode } from 'src/types/viewMode';

interface EditorState {
  openedPaths: string[];
  activePath: string;
  viewMode: ViewMode;
}

export const useEditorState = defineStore('editor', {
  state: (): EditorState => {
    return {
      openedPaths: [],
      activePath: '',
      viewMode: 'split'
    };
  }
});
