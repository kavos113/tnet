import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface ExplorerState {
  selectedPath: string | null;
  selectedDirPath: string | null;
  expandedPaths: string[];
}

const initialState: ExplorerState = {
  selectedPath: null,
  selectedDirPath: null,
  expandedPaths: []
};

const togglePath = (paths: string[], target: string): string[] => {
  return paths.includes(target) ? paths.filter((path) => path !== target) : [...paths, target];
};

const explorerSlice = createSlice({
  name: 'explorer',
  initialState,
  reducers: {
    selectFile: (state, action: PayloadAction<string>) => {
      state.selectedPath = action.payload;
      state.selectedDirPath = null;
    },
    selectDirectory: (state, action: PayloadAction<string>) => {
      state.selectedPath = null;
      state.selectedDirPath = action.payload;
      state.expandedPaths = togglePath(state.expandedPaths, action.payload);
    },
    selectDirectoryOnly: (state, action: PayloadAction<string>) => {
      state.selectedPath = null;
      state.selectedDirPath = action.payload;
    },
    addExpandedPath: (state, action: PayloadAction<string>) => {
      if (!state.expandedPaths.includes(action.payload)) {
        state.expandedPaths.push(action.payload);
      }
    },
    replaceSelectedPath: (
      state,
      action: PayloadAction<{
        oldPath: string;
        newPath: string;
      }>
    ) => {
      if (state.selectedPath === action.payload.oldPath)
        state.selectedPath = action.payload.newPath;
      if (state.selectedDirPath === action.payload.oldPath) {
        state.selectedDirPath = action.payload.newPath;
      }
      state.expandedPaths = state.expandedPaths.map((path) =>
        path === action.payload.oldPath ? action.payload.newPath : path
      );
    },
    setExpandedPaths: (state, action: PayloadAction<string[]>) => {
      state.expandedPaths = action.payload;
    },
    clearSelection: (state) => {
      state.selectedPath = null;
      state.selectedDirPath = null;
    },
    resetExplorerState: (state) => {
      state.selectedPath = null;
      state.selectedDirPath = null;
      state.expandedPaths = [];
    }
  }
});

export const {
  selectFile,
  selectDirectory,
  selectDirectoryOnly,
  addExpandedPath,
  replaceSelectedPath,
  setExpandedPaths,
  clearSelection,
  resetExplorerState
} = explorerSlice.actions;
export default explorerSlice.reducer;
