import { defineStore } from 'pinia';

interface WorkspaceState {
  rootPath: string;
}

export const useWorkspaceStore = defineStore('workspace', {
  state: (): WorkspaceState => {
    return {
      rootPath: ''
    };
  }
});
