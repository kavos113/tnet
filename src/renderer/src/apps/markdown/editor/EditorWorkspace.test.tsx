import { forwardRef, useImperativeHandle } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '@renderer/app/store';
import { openFile, updateActiveContent } from './editorSlice';
import { EditorWorkspace } from './EditorWorkspace';

const editorPaneProps = vi.hoisted(
  () =>
    [] as Array<{
      content: string;
      requestInlineCompletion?: unknown;
      isLargeDocument?: boolean;
    }>
);

const previewPaneProps = vi.hoisted(
  () =>
    [] as Array<{
      showOutline: boolean;
      onToggleTask?: unknown;
    }>
);

vi.mock('./EditorPane', () => ({
  EditorPane: forwardRef(
    (
      props: {
        content: string;
        requestInlineCompletion?: unknown;
        isLargeDocument?: boolean;
      },
      ref
    ) => {
      editorPaneProps.push(props);

      useImperativeHandle(ref, () => ({
        getScroller: () => null,
        getView: () => null,
        revealLine: () => true
      }));
      return <div data-testid="editor-pane-content" />;
    }
  )
}));

vi.mock('@renderer/apps/markdown/preview/PreviewPane', () => ({
  PreviewPane: forwardRef((props: { showOutline: boolean; onToggleTask?: unknown }, ref) => {
    previewPaneProps.push(props);
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
    previewPaneProps.length = 0;
    installTnetApi();
  });

  afterEach(() => {
    cleanup();
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

  it('does not warn about unstable selector results when rendering editor groups', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    expect(warnSpy.mock.calls.some((call) => String(call[0]).includes('Selector unknown'))).toBe(
      false
    );

    warnSpy.mockRestore();
  });

  it('toggles the preview outline from the editor toolbar', () => {
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    const outlineButton = screen.getByRole('button', { name: 'Outline' });
    expect(outlineButton).toHaveAttribute('aria-pressed', 'true');
    expect(previewPaneProps.at(-1)?.showOutline).toBe(true);

    fireEvent.click(outlineButton);

    expect(screen.getByRole('button', { name: 'Outline' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(previewPaneProps.at(-1)?.showOutline).toBe(false);
  });

  it('opens large files in editor-only mode until preview is explicitly requested', () => {
    const store = createAppStore();
    store.dispatch(
      openFile({ path: '/workspace/large.md', content: '# Large', sizeBytes: 512 * 1024 })
    );

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    expect(screen.getByTestId('editor-pane-content')).toBeInTheDocument();
    expect(screen.queryByTestId('preview-pane-content')).not.toBeInTheDocument();
    expect(editorPaneProps.at(-1)?.isLargeDocument).toBe(true);
    expect(screen.getByRole('button', { name: 'Editor' })).toHaveClass('active');

    fireEvent.click(screen.getByRole('button', { name: 'Split' }));

    expect(screen.getByTestId('preview-pane-content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Split' })).toHaveClass('active');
  });

  it('closes the active tab with Ctrl+W instead of leaving the shortcut to the window', () => {
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/first.md', content: '# First' }));
    store.dispatch(openFile({ path: '/workspace/second.md', content: '# Second' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    const editorTarget = screen.getByTestId('editor-pane-content');
    editorTarget.contentEditable = 'true';

    fireEvent.keyDown(editorTarget, {
      key: 'w',
      ctrlKey: true
    });

    expect(store.getState().editor.openedFiles.map((file) => file.path)).toEqual([
      '/workspace/first.md'
    ]);
    expect(store.getState().editor.activeIndex).toBe(0);
  });

  it('splits the active tab into a second group with an independent view mode', () => {
    const store = createAppStore();
    store.dispatch(openFile({ path: '/workspace/note.md', content: '# Note' }));

    render(
      <Provider store={store}>
        <EditorWorkspace />
      </Provider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Split Right' }));

    expect(store.getState().editor.isSecondaryGroupVisible).toBe(true);
    expect(store.getState().editor.groups.primary.tabs).toEqual(['/workspace/note.md']);
    expect(store.getState().editor.groups.secondary.tabs).toEqual(['/workspace/note.md']);
    expect(screen.getAllByTestId('editor-pane-content')).toHaveLength(2);

    fireEvent.click(screen.getAllByRole('button', { name: 'Preview' })[1]);

    expect(store.getState().editor.groups.primary.viewMode).toBe('split');
    expect(store.getState().editor.groups.secondary.viewMode).toBe('preview');
    expect(screen.getAllByTestId('editor-pane-content')).toHaveLength(1);
    expect(screen.getAllByTestId('preview-pane-content')).toHaveLength(2);
  });
});
