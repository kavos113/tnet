import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type requesterReducer from './requesterSlice';

export interface RequesterRootState {
  requester: ReturnType<typeof requesterReducer>;
}

export const useRequesterDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const useRequesterSelector: TypedUseSelectorHook<RequesterRootState> = useSelector;
