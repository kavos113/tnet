import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  const writeText = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText
      },
      configurable: true
    });
    writeText.mockResolvedValue(undefined);
  });

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

  it('applies column changes only after Apply is clicked', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openPdf({ path: 'paper.pdf' }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'PDF columns' }), {
      target: { value: '4' }
    });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].columns).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }));

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].columns).toBe(4);
  });

  it('changes columns with Ctrl+7 and Ctrl+8 shortcuts', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openPdf({ path: 'paper.pdf', viewState: { columns: 2 } }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    const viewer = screen.getByTestId('pdf-document-viewer');
    fireEvent.keyDown(viewer, { key: '7', ctrlKey: true });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].columns).toBe(1);

    fireEvent.keyDown(viewer, { key: '8', ctrlKey: true });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].columns).toBe(2);
  });

  it('changes zoom with Ctrl+plus, Ctrl+minus, and Ctrl+0 shortcuts', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openPdf({ path: 'paper.pdf', viewState: { customScale: 1 } }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    const viewer = screen.getByTestId('pdf-document-viewer');
    fireEvent.keyDown(viewer, { key: '=', ctrlKey: true });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].zoomMode).toBe('custom');
    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].customScale).toBeCloseTo(1.1);

    fireEvent.keyDown(viewer, { key: '-', ctrlKey: true });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf'].customScale).toBeCloseTo(1);

    fireEvent.keyDown(viewer, { key: '0', ctrlKey: true });

    expect(store.getState().pdfViewer.viewStateByPath['paper.pdf']).toMatchObject({
      zoomMode: 'actual-size',
      customScale: 1
    });
  });

  it('switches PDF tabs with Ctrl+Tab and Ctrl+Shift+Tab', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: '/workspace', fileTree: [] }));
    store.dispatch(openPdf({ path: 'first.pdf' }));
    store.dispatch(openPdf({ path: 'second.pdf' }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    const viewer = screen.getByTestId('pdf-document-viewer');
    fireEvent.keyDown(viewer, { key: 'Tab', ctrlKey: true, shiftKey: true });

    expect(store.getState().pdfViewer.activeIndex).toBe(0);

    fireEvent.keyDown(viewer, { key: 'Tab', ctrlKey: true });

    expect(store.getState().pdfViewer.activeIndex).toBe(1);
  });

  it('copies the active PDF link URL', () => {
    const store = createStore();
    store.dispatch(setWorkspace({ rootPath: 'C:/workspace/slides', fileTree: [] }));
    store.dispatch(openPdf({ path: 'nested/0407.pdf' }));

    render(
      <Provider store={store}>
        <PdfViewerApp />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy PDF link' }));

    expect(writeText).toHaveBeenCalledWith('pdf:slides/nested/0407.pdf');
  });
});
