import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type editorReducer from './editor/editorSlice';
import type explorerReducer from './explorer/explorerSlice';
import type workspaceReducer from './workspace/workspaceSlice';

export interface MarkdownRootState {
  editor: ReturnType<typeof editorReducer>;
  explorer: ReturnType<typeof explorerReducer>;
  workspace: ReturnType<typeof workspaceReducer>;
}

export const useMarkdownDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const useMarkdownSelector: TypedUseSelectorHook<MarkdownRootState> = useSelector;

export const useAppDispatch = useMarkdownDispatch;
export const useAppSelector = useMarkdownSelector;
