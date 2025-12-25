import { defineStore } from 'pinia';

interface ExplorerState {
  selectedPath: string | null;
  expandPaths: Set<string>;
}

export const useExplorerStore = defineStore('explorer', {
  state: (): ExplorerState => {
    return {
      selectedPath: null,
      expandPaths: new Set<string>()
    };
  }
});
