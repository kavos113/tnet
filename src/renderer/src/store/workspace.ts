import { ProjectConfig } from '@fixtures/config';
import { defineStore } from 'pinia';

interface WorkspaceState {
  rootPath: string;
  settings: ProjectConfig;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => {
    return {
      rootPath: '',
      settings: {
        editorFontFamily: 'monospace',
        editorFontSize: 16,
        previewFontFamily: 'sans-serif',
        previewFontSize: 16
      }
    };
  },
  actions: {
    async loadSettings() {
      if (!this.rootPath) return;
      try {
        const loaded = await window.electronConfigAPI.loadProjectConfig(this.rootPath);
        this.settings = loaded;
      } catch {
        console.error('failed to load project settings');
      }
    },
    async saveSettings(settings: ProjectConfig) {
      this.settings = settings;
      await window.electronConfigAPI.saveProjectConfig(
        this.rootPath,
        JSON.parse(JSON.stringify(settings))
      );
    }
  }
});
