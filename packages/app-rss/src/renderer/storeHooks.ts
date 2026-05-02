import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type rssReducer from './rssSlice';

export interface RssRootState {
  rss: ReturnType<typeof rssReducer>;
}

export const useRssDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const useRssSelector: TypedUseSelectorHook<RssRootState> = useSelector;
