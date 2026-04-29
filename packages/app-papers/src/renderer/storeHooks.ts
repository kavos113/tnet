import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type papersLibraryReducer from './library/librarySlice';

export interface PapersRootState {
  papersLibrary: ReturnType<typeof papersLibraryReducer>;
}

export const usePapersDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const usePapersSelector: TypedUseSelectorHook<PapersRootState> = useSelector;
