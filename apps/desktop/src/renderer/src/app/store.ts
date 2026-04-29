import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import { editorReducer, explorerReducer, workspaceReducer } from '@tnet/app-markdown/renderer';
import { papersContentReducer, papersLibraryReducer } from '@tnet/app-papers/renderer';

export interface RootState {
  app: ReturnType<typeof appReducer>;
  workspace: ReturnType<typeof workspaceReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  editor: ReturnType<typeof editorReducer>;
  papersLibrary: ReturnType<typeof papersLibraryReducer>;
  papersContent: ReturnType<typeof papersContentReducer>;
}

export const createAppStore = (): EnhancedStore<RootState> =>
  configureStore({
    reducer: {
      app: appReducer,
      workspace: workspaceReducer,
      explorer: explorerReducer,
      editor: editorReducer,
      papersLibrary: papersLibraryReducer,
      papersContent: papersContentReducer
    },
    devTools: import.meta.env.DEV
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
