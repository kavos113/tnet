import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import { defaultPapersLibraryConfig } from '@tnet/app-papers/shared/config';

export interface PapersLibraryState {
  libraryRoots: string[];
  activeLibraryRoot: string;
  settings: PapersLibraryConfig;
  isRestored: boolean;
}

const initialState: PapersLibraryState = {
  libraryRoots: [],
  activeLibraryRoot: '',
  settings: defaultPapersLibraryConfig(),
  isRestored: false
};

const librarySlice = createSlice({
  name: 'papersLibrary',
  initialState,
  reducers: {
    restorePapersLibrary: (
      state,
      action: PayloadAction<{
        libraryRoots: string[];
        activeLibraryRoot: string;
        settings?: PapersLibraryConfig;
      }>
    ) => {
      state.libraryRoots = action.payload.libraryRoots;
      state.activeLibraryRoot = action.payload.activeLibraryRoot;
      state.settings = action.payload.settings ?? defaultPapersLibraryConfig();
      state.isRestored = true;
    },
    setPapersLibrary: (
      state,
      action: PayloadAction<{
        libraryRoots: string[];
        activeLibraryRoot: string;
        settings?: PapersLibraryConfig;
      }>
    ) => {
      state.libraryRoots = action.payload.libraryRoots;
      state.activeLibraryRoot = action.payload.activeLibraryRoot;
      state.settings = action.payload.settings ?? defaultPapersLibraryConfig();
      state.isRestored = true;
    },
    markPapersLibraryRestored: (state) => {
      state.isRestored = true;
    }
  }
});

export const { markPapersLibraryRestored, restorePapersLibrary, setPapersLibrary } =
  librarySlice.actions;
export default librarySlice.reducer;
