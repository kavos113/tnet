import { describe, expect, it } from 'vitest';
import reducer, {
  closeFile,
  openFile,
  switchFile,
  togglePreviewOutline,
  updateActiveContent,
  type OpenFile
} from './editorSlice';

const initialState = {
  openedFiles: [] as OpenFile[],
  activeIndex: -1,
  viewMode: 'split' as const,
  isPreviewOutlineVisible: true,
  pendingReveal: null
};

describe('editorSlice', () => {
  it('opens files and focuses existing files instead of duplicating tabs', () => {
    let state = reducer(initialState, openFile({ path: 'C:\\workspace\\a.md', content: 'A' }));
    state = reducer(state, openFile({ path: '/workspace/b.md', content: 'B' }));
    state = reducer(state, openFile({ path: 'C:\\workspace\\a.md', content: 'A' }));

    expect(state.openedFiles).toHaveLength(2);
    expect(state.openedFiles[0].displayName).toBe('a.md');
    expect(state.activeIndex).toBe(0);
  });

  it('closes files and adjusts active index', () => {
    let state = reducer(initialState, openFile({ path: '/a.md', content: 'A' }));
    state = reducer(state, openFile({ path: '/b.md', content: 'B' }));
    state = reducer(state, openFile({ path: '/c.md', content: 'C' }));
    state = reducer(state, switchFile(1));

    state = reducer(state, closeFile(1));

    expect(state.openedFiles.map((file) => file.path)).toEqual(['/a.md', '/c.md']);
    expect(state.activeIndex).toBe(0);
  });

  it('marks active files modified when content changes', () => {
    let state = reducer(initialState, openFile({ path: '/a.md', content: 'A' }));

    state = reducer(state, updateActiveContent('Changed'));

    expect(state.openedFiles[0].content).toBe('Changed');
    expect(state.openedFiles[0].isModified).toBe(true);
  });

  it('toggles preview outline visibility', () => {
    const state = reducer(initialState, togglePreviewOutline());

    expect(state.isPreviewOutlineVisible).toBe(false);
  });
});
