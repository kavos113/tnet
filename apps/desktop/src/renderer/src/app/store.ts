import { configureStore, type EnhancedStore } from '@reduxjs/toolkit';
import appReducer from './appSlice';
import { editorReducer, explorerReducer, workspaceReducer } from '@tnet/app-markdown/renderer';
import { papersContentReducer, papersLibraryReducer } from '@tnet/app-papers/renderer';
import { requesterReducer } from '@tnet/app-requester/renderer';
import { dbInspectorReducer } from '@tnet/app-db-inspector/renderer';
import { tasksReducer } from '@tnet/app-tasks/renderer';
import { pdfViewerReducer } from '@tnet/app-pdf-viewer/renderer';

export interface RootState {
  app: ReturnType<typeof appReducer>;
  tasks: ReturnType<typeof tasksReducer>;
  pdfViewer: ReturnType<typeof pdfViewerReducer>;
  workspace: ReturnType<typeof workspaceReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  editor: ReturnType<typeof editorReducer>;
  papersLibrary: ReturnType<typeof papersLibraryReducer>;
  papersContent: ReturnType<typeof papersContentReducer>;
  requester: ReturnType<typeof requesterReducer>;
  dbInspector: ReturnType<typeof dbInspectorReducer>;
}

export const createAppStore = (): EnhancedStore<RootState> =>
  configureStore({
    reducer: {
      app: appReducer,
      tasks: tasksReducer,
      pdfViewer: pdfViewerReducer,
      workspace: workspaceReducer,
      explorer: explorerReducer,
      editor: editorReducer,
      papersLibrary: papersLibraryReducer,
      papersContent: papersContentReducer,
      requester: requesterReducer,
      dbInspector: dbInspectorReducer
    },
    devTools: import.meta.env.DEV
  });

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type AppDispatch = AppStore['dispatch'];
