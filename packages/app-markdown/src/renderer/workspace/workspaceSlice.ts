import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProjectConfig } from '@tnet/shared/types/config';
import { defaultProjectConfig, normalizeProjectConfig } from '@tnet/shared/types/config';
import type { FileItem } from '@tnet/shared/types/file';

export interface WorkspaceState {
  rootPath: string;
  workspaceRoots: string[];
  fileTree: FileItem[];
  settings: ProjectConfig;
}

const initialState: WorkspaceState = {
  rootPath: '',
  workspaceRoots: [],
  fileTree: [],
  settings: defaultProjectConfig()
};

const addUniqueRoot = (roots: string[], rootPath: string): string[] => {
  if (!rootPath || roots.includes(rootPath)) return roots;
  return [...roots, rootPath];
};

const uniqueRoots = (roots: string[]): string[] => Array.from(new Set(roots.filter(Boolean)));

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspace: (
      state,
      action: PayloadAction<{
        rootPath: string;
        fileTree: FileItem[];
        workspaceRoots?: string[];
      }>
    ) => {
      state.rootPath = action.payload.rootPath;
      state.fileTree = action.payload.fileTree;
      state.workspaceRoots = addUniqueRoot(
        action.payload.workspaceRoots ?? state.workspaceRoots,
        action.payload.rootPath
      );
    },
    setWorkspaceRoots: (state, action: PayloadAction<string[]>) => {
      state.workspaceRoots = uniqueRoots(action.payload);
    },
    setFileTree: (state, action: PayloadAction<FileItem[]>) => {
      state.fileTree = action.payload;
    },
    setSettings: (state, action: PayloadAction<ProjectConfig>) => {
      state.settings = normalizeProjectConfig(action.payload);
    }
  }
});

export const { setWorkspace, setWorkspaceRoots, setFileTree, setSettings } = workspaceSlice.actions;
export default workspaceSlice.reducer;
