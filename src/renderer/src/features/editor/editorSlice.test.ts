import { describe, expect, it } from 'vitest';
import reducer, {
  closeSecondaryGroup,
  closeFile,
  openFile,
  splitActiveTabRight,
  switchFile,
  togglePreviewOutline,
  updateActiveContent
} from './editorSlice';

const createInitialState = (): ReturnType<typeof reducer> =>
  reducer(undefined, { type: 'editor/test-init' });

describe('editorSlice', () => {
  it('opens files and focuses existing files instead of duplicating tabs', () => {
    let state = reducer(
      createInitialState(),
      openFile({ path: 'C:\\workspace\\a.md', content: 'A' })
    );
    state = reducer(state, openFile({ path: '/workspace/b.md', content: 'B' }));
    state = reducer(state, openFile({ path: 'C:\\workspace\\a.md', content: 'A' }));

    expect(state.openedFiles).toHaveLength(2);
    expect(state.openedFiles[0].displayName).toBe('a.md');
    expect(state.activeIndex).toBe(0);
  });

  it('closes files and adjusts active index', () => {
    let state = reducer(createInitialState(), openFile({ path: '/a.md', content: 'A' }));
    state = reducer(state, openFile({ path: '/b.md', content: 'B' }));
    state = reducer(state, openFile({ path: '/c.md', content: 'C' }));
    state = reducer(state, switchFile(1));

    state = reducer(state, closeFile(1));

    expect(state.openedFiles.map((file) => file.path)).toEqual(['/a.md', '/c.md']);
    expect(state.activeIndex).toBe(0);
  });

  it('marks active files modified when content changes', () => {
    let state = reducer(createInitialState(), openFile({ path: '/a.md', content: 'A' }));

    state = reducer(state, updateActiveContent('Changed'));

    expect(state.openedFiles[0].content).toBe('Changed');
    expect(state.openedFiles[0].isModified).toBe(true);
  });

  it('toggles preview outline visibility', () => {
    const state = reducer(createInitialState(), togglePreviewOutline());

    expect(state.isPreviewOutlineVisible).toBe(false);
  });

  it('opens the same file in the secondary group without duplicating it in the primary group', () => {
    let state = reducer(createInitialState(), openFile({ path: '/a.md', content: 'A' }));

    state = reducer(state, splitActiveTabRight());

    expect(state.isSecondaryGroupVisible).toBe(true);
    expect(state.groups.primary.tabs).toEqual(['/a.md']);
    expect(state.groups.secondary.tabs).toEqual(['/a.md']);
    expect(state.activeGroupId).toBe('secondary');
    expect(Object.keys(state.filesByPath)).toEqual(['/a.md']);
  });

  it('shares file content between groups for the same path', () => {
    let state = reducer(createInitialState(), openFile({ path: '/a.md', content: 'A' }));
    state = reducer(state, splitActiveTabRight());

    state = reducer(state, updateActiveContent({ groupId: 'secondary', content: 'Changed' }));

    expect(state.filesByPath['/a.md'].content).toBe('Changed');
    expect(state.groups.primary.tabs).toEqual(['/a.md']);
    expect(state.groups.secondary.tabs).toEqual(['/a.md']);
    expect(state.openedFiles[0].content).toBe('Changed');
  });

  it('merges secondary tabs into the primary group when closing the secondary group', () => {
    let state = reducer(createInitialState(), openFile({ path: '/a.md', content: 'A' }));
    state = reducer(state, openFile({ path: '/b.md', content: 'B', targetGroupId: 'secondary' }));

    state = reducer(state, closeSecondaryGroup());

    expect(state.isSecondaryGroupVisible).toBe(false);
    expect(state.activeGroupId).toBe('primary');
    expect(state.groups.primary.tabs).toEqual(['/a.md', '/b.md']);
    expect(state.openedFiles.map((file) => file.path)).toEqual(['/a.md', '/b.md']);
    expect(state.activeIndex).toBe(1);
  });
});
