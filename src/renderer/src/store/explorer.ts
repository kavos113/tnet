import { defineStore } from 'pinia';

interface ExplorerState {
  selectedPath: string;
}

export const useExplorerStore = defineStore('explorer', {
  state: (): ExplorerState => {
    return {
      selectedPath: ''
    };
  }
});
