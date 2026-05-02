import { configureStore } from '@reduxjs/toolkit';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it } from 'vitest';
import pdfViewerReducer, { setWorkspace } from './state/pdfViewerSlice';
import { PdfViewerSidebar } from './PdfViewerSidebar';

const createStore = () =>
  configureStore({
    reducer: {
      pdfViewer: pdfViewerReducer
    }
  });

describe('PdfViewerSidebar', () => {
  afterEach(() => cleanup());

  it('keeps workspace directories collapsed until the user opens them', () => {
    const store = createStore();
    store.dispatch(
      setWorkspace({
        rootPath: '/workspace',
        workspaceRoots: ['/workspace'],
        fileTree: [
          {
            name: 'docs',
            path: '/workspace/docs',
            isDirectory: true,
            children: [{ name: 'guide.pdf', path: '/workspace/docs/guide.pdf', isDirectory: false }]
          }
        ]
      })
    );

    render(
      <Provider store={store}>
        <PdfViewerSidebar />
      </Provider>
    );

    expect(screen.queryByText('guide.pdf')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('docs'));

    expect(screen.getByText('guide.pdf')).toBeInTheDocument();
  });
});
