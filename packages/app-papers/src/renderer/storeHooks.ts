import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type papersLibraryReducer from './library/librarySlice';
import type papersContentReducer from './papers/papersSlice';

export interface PapersRootState {
  papersLibrary: ReturnType<typeof papersLibraryReducer>;
  papersContent: ReturnType<typeof papersContentReducer>;
}

export const usePapersDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const usePapersSelector: TypedUseSelectorHook<PapersRootState> = useSelector;
