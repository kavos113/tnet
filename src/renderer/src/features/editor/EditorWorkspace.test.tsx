import { forwardRef, useImperativeHandle } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { openFile, updateActiveContent } from './editorSlice';
import { EditorWorkspace } from './EditorWorkspace';

const editorPaneProps = vi.hoisted(
  () =>
    [] as Array<{
      content: string;
      requestInlineCompletion?: unknown;
    }>
);

vi.mock('./EditorPane', () => ({
  EditorPane: forwardRef(
    (
      props: {
        content: string;
        requestInlineCompletion?: unknown;
      },
      ref
    ) => {
      editorPaneProps.push(props);

      useImperativeHandle(ref, () => ({
        getScroller: () => null
      }));
      return <div data-testid="editor-pane-content" />;
    }
  )
}));

vi.mock('@renderer/features/preview/PreviewPane', () => ({
  PreviewPane: forwardRef((_, ref) => {
    useImperativeHandle(ref, () => ({
      getPreviewElement: () => null
    }));
    return <div data-testid="preview-pane-content" />;
  })
}));

const installTnetApi = (): void => {
  Object.defineProperty(window, 'tnet', {
    value: {
      workspace: {
        openDirectory: vi.fn(),
        getFileTree: vi.fn()
      },
      file: {
        read: vi.fn(),
        write: vi.fn(),
        create: vi.fn(),
        createDirectory: vi.fn(),
        delete: vi.fn(),
        rename: vi.fn()
      },
      session: {
        load: vi.fn(),
        save: vi.fn()
      },
      config: {
        loadGlobal: vi.fn(),
        saveGlobal: vi.fn(),
        loadProject: vi.fn(),
        saveProject: vi.fn()
      },
      keyword: {
        loadIndex: vi.fn().mockResolvedValue({}),
        getContent: vi.fn()
      },
      llm: {
        getInlineCompletion: vi.fn()
      }
    },
    writable: true
  });
};

describe('EditorWorkspace split resize', () => {
  beforeEach(() => {
    editorPaneProps.length = 0;
    installTnetApi();
  });

  it('resizes editor and preview panes by dragging the split separator', () => {
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    const separator = screen.getByRole('separator', { name: 'Resize editor and preview' });
    const splitContainer = separator.parentElement;
    expect(splitContainer).not.toBeNull();

    Object.defineProperty(splitContainer, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        width: 500,
        top: 0,
        height: 300,
        right: 600,
        bottom: 300,
        x: 100,
        y: 0,
        toJSON: () => ({})
      })
    });

    fireEvent.mouseDown(separator, { clientX: 350 });
    fireEvent.mouseMove(document, { clientX: 500 });
    fireEvent.mouseUp(document);

    const editorPane = screen.getByTestId('editor-pane-content').parentElement;
    const previewPane = screen.getByTestId('preview-pane-content').parentElement;

    expect(editorPane).toHaveStyle({ width: '80%' });
    expect(previewPane).toHaveStyle({ width: '20%' });
  });

  it('keeps the inline completion requester stable while editing the same file', () => {
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    const initialRequester = editorPaneProps.at(-1)?.requestInlineCompletion;

    act(() => {
      store.dispatch(updateActiveContent('# Note\nEdited'));
    });

    expect(editorPaneProps.at(-1)?.content).toBe('# Note\nEdited');
    expect(editorPaneProps.at(-1)?.requestInlineCompletion).toBe(initialRequester);
  });
});
