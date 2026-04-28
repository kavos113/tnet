import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import editorReducer from '@renderer/features/editor/editorSlice';
import explorerReducer from '@renderer/features/explorer/explorerSlice';
import workspaceReducer from '@renderer/features/workspace/workspaceSlice';

export interface RootState {
  app: ReturnType<typeof appReducer>;
  workspace: ReturnType<typeof workspaceReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  editor: ReturnType<typeof editorReducer>;
}

export const createAppStore = (): EnhancedStore<RootState> =>
  configureStore({
    reducer: {
      app: appReducer,
      workspace: workspaceReducer,
      explorer: explorerReducer,
      editor: editorReducer
    },
    devTools: import.meta.env.DEV
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
