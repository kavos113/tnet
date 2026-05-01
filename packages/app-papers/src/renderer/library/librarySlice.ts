import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PapersGlobalSettings, PapersLibraryConfig } from '@tnet/app-papers/shared/config';
import {
  defaultPapersGlobalSettings,
  defaultPapersLibraryConfig
} from '@tnet/app-papers/shared/config';
import type { FileItem } from '@tnet/shared/types/file';

export interface PapersLibraryState {
  libraryRoots: string[];
  activeLibraryRoot: string;
  directoryTree: FileItem[];
  selectedDirectoryPath: string | null;
  expandedDirectoryPaths: string[];
  settings: PapersLibraryConfig;
  globalSettings: PapersGlobalSettings;
  isRestored: boolean;
}

const initialState: PapersLibraryState = {
  libraryRoots: [],
  activeLibraryRoot: '',
  directoryTree: [],
  selectedDirectoryPath: null,
  expandedDirectoryPaths: [],
  settings: defaultPapersLibraryConfig(),
  globalSettings: defaultPapersGlobalSettings(),
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
        directoryTree?: FileItem[];
        settings?: PapersLibraryConfig;
        globalSettings?: PapersGlobalSettings;
      }>
    ) => {
      state.libraryRoots = action.payload.libraryRoots;
      state.activeLibraryRoot = action.payload.activeLibraryRoot;
      state.directoryTree = action.payload.directoryTree ?? [];
      state.selectedDirectoryPath = null;
      state.expandedDirectoryPaths = [];
      state.settings = action.payload.settings ?? defaultPapersLibraryConfig();
      state.globalSettings = action.payload.globalSettings ?? defaultPapersGlobalSettings();
      state.isRestored = true;
    },
    setPapersLibrary: (
      state,
      action: PayloadAction<{
        libraryRoots: string[];
        activeLibraryRoot: string;
        directoryTree?: FileItem[];
        settings?: PapersLibraryConfig;
        globalSettings?: PapersGlobalSettings;
      }>
    ) => {
      state.libraryRoots = action.payload.libraryRoots;
      state.activeLibraryRoot = action.payload.activeLibraryRoot;
      state.directoryTree = action.payload.directoryTree ?? [];
      state.selectedDirectoryPath = null;
      state.expandedDirectoryPaths = [];
      state.settings = action.payload.settings ?? defaultPapersLibraryConfig();
      state.globalSettings = action.payload.globalSettings ?? state.globalSettings;
      state.isRestored = true;
    },
    setPapersLibrarySettings: (state, action: PayloadAction<PapersLibraryConfig>) => {
      state.settings = action.payload;
    },
    setPapersGlobalSettings: (state, action: PayloadAction<PapersGlobalSettings>) => {
      state.globalSettings = {
        ...defaultPapersGlobalSettings(),
        ...action.payload
      };
    },
    setSelectedPapersDirectory: (state, action: PayloadAction<string | null>) => {
      state.selectedDirectoryPath = action.payload;
    },
    setPapersDirectoryTree: (state, action: PayloadAction<FileItem[]>) => {
      state.directoryTree = action.payload;
    },
    addExpandedPapersDirectory: (state, action: PayloadAction<string>) => {
      if (state.expandedDirectoryPaths.includes(action.payload)) return;
      state.expandedDirectoryPaths = [...state.expandedDirectoryPaths, action.payload];
    },
    toggleExpandedPapersDirectory: (state, action: PayloadAction<string>) => {
      state.expandedDirectoryPaths = state.expandedDirectoryPaths.includes(action.payload)
        ? state.expandedDirectoryPaths.filter((path) => path !== action.payload)
        : [...state.expandedDirectoryPaths, action.payload];
    },
    markPapersLibraryRestored: (state) => {
      state.isRestored = true;
    }
  }
});

export const {
  addExpandedPapersDirectory,
  markPapersLibraryRestored,
  restorePapersLibrary,
  setPapersDirectoryTree,
  setPapersGlobalSettings,
  setPapersLibrary,
  setPapersLibrarySettings,
  setSelectedPapersDirectory,
  toggleExpandedPapersDirectory
} = librarySlice.actions;
export default librarySlice.reducer;
