import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import pdfViewerReducer, { openPdf, setWorkspace } from './state/pdfViewerSlice';
import { PdfViewerApp } from './PdfViewerApp';

vi.mock('./components/viewer/PdfDocumentViewer', () => ({
  PdfDocumentViewer: () => <div data-testid="pdf-document-viewer" contentEditable />
}));

const createStore = () =>
  configureStore({
    reducer: {
      pdfViewer: pdfViewerReducer
    }
  });

describe('PdfViewerApp', () => {
  afterEach(() => cleanup());

  it('closes the active PDF tab with Ctrl+W', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openPdf({ path: 'first.pdf' }));
    store.dispatch(openPdf({ path: 'second.pdf' }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    fireEvent.keyDown(screen.getByTestId('pdf-document-viewer'), {
      key: 'w',
      ctrlKey: true
    });

    expect(store.getState().pdfViewer.tabs).toEqual(['first.pdf']);
    expect(store.getState().pdfViewer.activeIndex).toBe(0);
  });
});
