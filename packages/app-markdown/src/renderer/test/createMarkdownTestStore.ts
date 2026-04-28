import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import { editorReducer, explorerReducer, workspaceReducer } from '@tnet/app-markdown/renderer';

export interface TestMarkdownRootState {
  workspace: ReturnType<typeof workspaceReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  editor: ReturnType<typeof editorReducer>;
}

export const createAppStore = (): EnhancedStore<TestMarkdownRootState> =>
  configureStore({
    reducer: {
      workspace: workspaceReducer,
      explorer: explorerReducer,
      editor: editorReducer
    }
  });

export type AppStore = ReturnType<typeof createAppStore>;
