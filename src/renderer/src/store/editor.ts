import { defineStore } from 'pinia';
import { ViewMode } from '@fixtures/viewMode';

interface OpenFile {
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

const getDisplayName = (filePath: string): string => {
  const fileName = filePath.includes('\\') ? filePath.split('\\').pop() : filePath.split('/').pop();
  return fileName ? fileName : filePath;
};

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => {
    return {
      openedFiles: [],
      activeIndex: -1,
      viewMode: 'split'
    };
  },
  actions: {
    async open(path: string): Promise<void> {
      try {
        const existingIndex = this.openedFiles.findIndex((file) => file.path === path);
        if (existingIndex !== -1) {
          this.activeIndex = existingIndex;
          return;
        }

        const content = await window.electronAPI.readFile(path);

        const newFile: OpenFile = {
          path: path,
          content: content,
          isModified: false,
          displayName: getDisplayName(path)
        };

        this.openedFiles.push(newFile);
        this.activeIndex = this.openedFiles.length - 1;
      } catch (err) {
        console.error('error in reading files', err);

        const newFile: OpenFile = {
          path: path,
          content: 'error reading file',
          isModified: false,
          displayName: getDisplayName(path)
        };

        this.openedFiles.push(newFile);
        this.activeIndex = this.openedFiles.length - 1;
      }
    },
    close(index: number): void {
      if (index < 0 || index >= this.openedFiles.length) return;

      this.openedFiles.splice(index, 1);

      if (this.openedFiles.length === 0) {
        this.activeIndex = -1;
      } else if (index <= this.activeIndex) {
        if (this.activeIndex > 0) {
          this.activeIndex--;
        } else {
          this.activeIndex = 0;
        }
      }
    },
    switch(index: number): void {
      if (index >= 0 && index < this.openedFiles.length) {
        this.activeIndex = index;
      }
    }
  }
});
