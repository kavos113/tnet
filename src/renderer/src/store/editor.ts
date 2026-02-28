import { defineStore } from 'pinia';
import { ViewMode } from '@fixtures/viewMode';
import { markdownService } from '@renderer/services/markdownService';
import { nextTick } from 'vue';

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
  localContent: string;
  htmlPreview: string;
  filePath: string;
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
      viewMode: 'split',
      localContent: '',
      htmlPreview: '',
      filePath: ''
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
    closeByPath(path: string): void {
      const index = this.openedFiles.findIndex((file) => file.path === path);
      if (index === -1) return;
      this.close(index);
    },
    renameOpenedPath(oldPath: string, newPath: string): void {
      const idx = this.openedFiles.findIndex((file) => file.path === oldPath);
      if (idx === -1) return;
      this.openedFiles[idx].path = newPath;
      this.openedFiles[idx].displayName = getDisplayName(newPath);
    },
    switch(index: number): void {
      if (index >= 0 && index < this.openedFiles.length) {
        this.activeIndex = index;
      }
    },
    syncFromActiveFile(): void {
      if (this.activeIndex >= 0 && this.activeIndex < this.openedFiles.length) {
        this.localContent = this.openedFiles[this.activeIndex].content;
        this.filePath = this.openedFiles[this.activeIndex].path;
      }
    },
    updateLocalContent(content: string): void {
      this.localContent = content;
      if (this.activeIndex >= 0 && this.activeIndex < this.openedFiles.length) {
        const file = this.openedFiles[this.activeIndex];
        if (file.content !== content) {
          file.content = content;
          file.isModified = true;
        }
      }
    },
    async updatePreview(): Promise<void> {
      if (this.localContent === null || this.localContent === undefined) {
        this.htmlPreview = '';
        return;
      }
      try {
        this.htmlPreview = await markdownService.parse(this.localContent);
        await nextTick();
        markdownService.renderMermaidDiagrams();
      } catch (err) {
        console.error('error rendering markdown', err);
        this.htmlPreview = '<p>error rendering markdown</p>';
      }
    }
  }
});
