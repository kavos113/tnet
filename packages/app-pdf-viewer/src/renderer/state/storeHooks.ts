import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { UnknownAction } from '@reduxjs/toolkit';
import type pdfViewerReducer from './pdfViewerSlice';

export interface PdfViewerRootState {
  pdfViewer: ReturnType<typeof pdfViewerReducer>;
}

export const usePdfViewerDispatch = (): ((action: UnknownAction) => unknown) => useDispatch();
export const usePdfViewerSelector: TypedUseSelectorHook<PdfViewerRootState> = useSelector;
