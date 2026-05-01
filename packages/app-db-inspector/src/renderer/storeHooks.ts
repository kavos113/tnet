import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type dbInspectorReducer from './dbInspectorSlice';

export interface DbInspectorRootState {
  dbInspector: ReturnType<typeof dbInspectorReducer>;
}

export const useDbInspectorDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const useDbInspectorSelector: TypedUseSelectorHook<DbInspectorRootState> = useSelector;
