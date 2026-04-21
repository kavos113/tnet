import { create } from 'zustand';
import type { ProjectConfig } from '@shared/types/config';
import { defaultProjectConfig } from '@shared/types/config';
import type { FileItem } from '@shared/types/file';

interface WorkspaceState {
  rootPath: string;
  fileTree: FileItem[];
  settings: ProjectConfig;
  setWorkspace: (rootPath: string, fileTree: FileItem[]) => void;
  setFileTree: (fileTree: FileItem[]) => void;
  setSettings: (settings: ProjectConfig) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  rootPath: '',
  fileTree: [],
  settings: defaultProjectConfig(),
  setWorkspace: (rootPath, fileTree) => set({ rootPath, fileTree }),
  setFileTree: (fileTree) => set({ fileTree }),
  setSettings: (settings) => set({ settings })
}));
