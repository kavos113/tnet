import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import editorReducer from '@renderer/features/editor/editorSlice';
import explorerReducer from '@renderer/features/explorer/explorerSlice';
import workspaceReducer from '@renderer/features/workspace/workspaceSlice';

export interface RootState {
  workspace: ReturnType<typeof workspaceReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  editor: ReturnType<typeof editorReducer>;
}

export const createAppStore = (): EnhancedStore<RootState> =>
  configureStore({
    reducer: {
      workspace: workspaceReducer,
      explorer: explorerReducer,
      editor: editorReducer
    }
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
