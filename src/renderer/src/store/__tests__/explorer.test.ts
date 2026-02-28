import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useExplorerStore } from '../explorer';

describe('useExplorerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初期状態', () => {
    it('デフォルト値が正しい', () => {
      const store = useExplorerStore();
      expect(store.selectedPath).toBeNull();
      expect(store.selectedDirPath).toBeNull();
      expect(store.expandPaths).toBeInstanceOf(Set);
      expect(store.expandPaths.size).toBe(0);
    });
  });

  describe('selectedPath', () => {
    it('パスを設定できる', () => {
      const store = useExplorerStore();
      store.selectedPath = '/path/to/file.md';
      expect(store.selectedPath).toBe('/path/to/file.md');
    });

    it('nullに戻せる', () => {
      const store = useExplorerStore();
      store.selectedPath = '/path/to/file.md';
      store.selectedPath = null;
      expect(store.selectedPath).toBeNull();
    });
  });

  describe('selectedDirPath', () => {
    it('ディレクトリパスを設定できる', () => {
      const store = useExplorerStore();
      store.selectedDirPath = '/path/to/dir';
      expect(store.selectedDirPath).toBe('/path/to/dir');
    });
  });

  describe('expandPaths', () => {
    it('パスを追加・削除できる', () => {
      const store = useExplorerStore();
      store.expandPaths.add('/dir1');
      store.expandPaths.add('/dir2');
      expect(store.expandPaths.size).toBe(2);
      expect(store.expandPaths.has('/dir1')).toBe(true);

      store.expandPaths.delete('/dir1');
      expect(store.expandPaths.size).toBe(1);
      expect(store.expandPaths.has('/dir1')).toBe(false);
    });
  });
});
