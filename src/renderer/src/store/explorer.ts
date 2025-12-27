import { defineStore } from 'pinia';

interface ExplorerState {
  selectedPath: string | null;
  selectedDirPath: string | null;
  expandPaths: Set<string>;
}

export const useExplorerStore = defineStore('explorer', {
  state: (): ExplorerState => {
    return {
      selectedPath: null,
      selectedDirPath: null,
      expandPaths: new Set<string>()
    };
  }
});
