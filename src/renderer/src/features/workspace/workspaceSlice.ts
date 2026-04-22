import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ProjectConfig } from '@shared/types/config';
import { defaultProjectConfig } from '@shared/types/config';
import type { FileItem } from '@shared/types/file';

interface WorkspaceState {
  rootPath: string;
  fileTree: FileItem[];
  settings: ProjectConfig;
}

const initialState: WorkspaceState = {
  rootPath: '',
  fileTree: [],
  settings: defaultProjectConfig()
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    setWorkspace: (
      state,
      action: PayloadAction<{
        rootPath: string;
        fileTree: FileItem[];
      }>
    ) => {
      state.rootPath = action.payload.rootPath;
      state.fileTree = action.payload.fileTree;
    },
    setFileTree: (state, action: PayloadAction<FileItem[]>) => {
      state.fileTree = action.payload;
    },
    setSettings: (state, action: PayloadAction<ProjectConfig>) => {
      state.settings = {
        ...defaultProjectConfig(),
        ...action.payload
      };
    }
  }
});

export const { setWorkspace, setFileTree, setSettings } = workspaceSlice.actions;
export default workspaceSlice.reducer;
