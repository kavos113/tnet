import { beforeEach, describe, expect, it } from 'vitest';
import { useEditorStore } from './editorStore';

describe('editorStore', () => {
  beforeEach(() => {
    useEditorStore.setState({
      openedFiles: [],
      activeIndex: -1,
      viewMode: 'split'
    });
  });

  it('opens files and focuses existing files instead of duplicating tabs', () => {
    const store = useEditorStore.getState();

    store.openFile('C:\\workspace\\a.md', 'A');
    useEditorStore.getState().openFile('/workspace/b.md', 'B');
    useEditorStore.getState().openFile('C:\\workspace\\a.md', 'A');

    const state = useEditorStore.getState();
    expect(state.openedFiles).toHaveLength(2);
    expect(state.openedFiles[0].displayName).toBe('a.md');
    expect(state.activeIndex).toBe(0);
  });

  it('closes files and adjusts active index', () => {
    const store = useEditorStore.getState();
    store.openFile('/a.md', 'A');
    useEditorStore.getState().openFile('/b.md', 'B');
    useEditorStore.getState().openFile('/c.md', 'C');
    useEditorStore.getState().switchFile(1);

    useEditorStore.getState().closeFile(1);

    const state = useEditorStore.getState();
    expect(state.openedFiles.map((file) => file.path)).toEqual(['/a.md', '/c.md']);
    expect(state.activeIndex).toBe(0);
  });

  it('marks active files modified when content changes', () => {
    const store = useEditorStore.getState();
    store.openFile('/a.md', 'A');

    useEditorStore.getState().updateActiveContent('Changed');

    const file = useEditorStore.getState().openedFiles[0];
    expect(file.content).toBe('Changed');
    expect(file.isModified).toBe(true);
  });
});
