import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ExplorerState {
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
    setExpandedPaths: (state, action: PayloadAction<string[]>) => {
      state.expandedPaths = action.payload;
    },
    clearSelection: (state) => {
      state.selectedPath = null;
      state.selectedDirPath = null;
    }
  }
});

export const { selectFile, selectDirectory, setExpandedPaths, clearSelection } =
  explorerSlice.actions;
export default explorerSlice.reducer;
