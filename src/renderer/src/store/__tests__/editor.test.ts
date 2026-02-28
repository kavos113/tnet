import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useEditorStore } from '../editor';

vi.mock('@renderer/services/markdownService', () => ({
  markdownService: {
    parse: vi.fn().mockResolvedValue('<p>preview</p>'),
    renderMermaidDiagrams: vi.fn()
  }
}));

const mockElectronAPI = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  getFileTree: vi.fn(),
  getNewFileTree: vi.fn(),
  getKeywordContent: vi.fn(),
  createFile: vi.fn(),
  createDirectory: vi.fn(),
  deleteFile: vi.fn(),
  renamePath: vi.fn(),
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  loadKeywords: vi.fn()
};

Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true });

describe('useEditorStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('デフォルト値が正しい', () => {
      const store = useEditorStore();
      expect(store.openedFiles).toEqual([]);
      expect(store.activeIndex).toBe(-1);
      expect(store.viewMode).toBe('split');
      expect(store.localContent).toBe('');
      expect(store.htmlPreview).toBe('');
      expect(store.filePath).toBe('');
    });
  });

  describe('open', () => {
    it('ファイルを開いてactiveIndexが更新される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('# Hello');

      await store.open('/path/to/file.md');

      expect(store.openedFiles).toHaveLength(1);
      expect(store.openedFiles[0].path).toBe('/path/to/file.md');
      expect(store.openedFiles[0].content).toBe('# Hello');
      expect(store.openedFiles[0].isModified).toBe(false);
      expect(store.openedFiles[0].displayName).toBe('file.md');
      expect(store.activeIndex).toBe(0);
    });

    it('既に開いているファイルはactiveIndexのみ更新される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content1');
      await store.open('/path/to/file1.md');

      mockElectronAPI.readFile.mockResolvedValue('content2');
      await store.open('/path/to/file2.md');

      expect(store.activeIndex).toBe(1);

      await store.open('/path/to/file1.md');
      expect(store.activeIndex).toBe(0);
      expect(store.openedFiles).toHaveLength(2);
    });

    it('readFileがエラーの場合はエラーメッセージを表示する', async () => {
      const store = useEditorStore();
      const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
      mockElectronAPI.readFile.mockRejectedValue(new Error('read error'));

      await store.open('/path/to/fail.md');

      expect(store.openedFiles).toHaveLength(1);
      expect(store.openedFiles[0].content).toBe('error reading file');
      spy.mockRestore();
    });

    it('Windowsパスのファイル名を正しく表示する', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');

      await store.open('C:\\Users\\test\\file.md');

      expect(store.openedFiles[0].displayName).toBe('file.md');
    });
  });

  describe('close', () => {
    it('タブを閉じるとopenedFilesから除去される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');
      await store.open('/b.md');

      store.close(0);

      expect(store.openedFiles).toHaveLength(1);
      expect(store.openedFiles[0].path).toBe('/b.md');
    });

    it('アクティブタブを閉じるとactiveIndexが調整される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');
      await store.open('/b.md');
      await store.open('/c.md');
      store.activeIndex = 1;

      store.close(1);

      expect(store.activeIndex).toBe(0);
    });

    it('全てのタブを閉じるとactiveIndexが-1になる', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');

      store.close(0);

      expect(store.activeIndex).toBe(-1);
      expect(store.openedFiles).toHaveLength(0);
    });

    it('範囲外のインデックスは無視される', () => {
      const store = useEditorStore();
      store.close(-1);
      store.close(100);
      expect(store.openedFiles).toHaveLength(0);
    });
  });

  describe('closeByPath', () => {
    it('パスで指定してタブを閉じる', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');
      await store.open('/b.md');

      store.closeByPath('/a.md');

      expect(store.openedFiles).toHaveLength(1);
      expect(store.openedFiles[0].path).toBe('/b.md');
    });

    it('存在しないパスは無視される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');

      store.closeByPath('/nonexistent.md');

      expect(store.openedFiles).toHaveLength(1);
    });
  });

  describe('renameOpenedPath', () => {
    it('開いているファイルのパスとdisplayNameを更新する', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/old.md');

      store.renameOpenedPath('/old.md', '/new.md');

      expect(store.openedFiles[0].path).toBe('/new.md');
      expect(store.openedFiles[0].displayName).toBe('new.md');
    });

    it('存在しないパスは無視される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');

      store.renameOpenedPath('/nonexistent.md', '/new.md');

      expect(store.openedFiles[0].path).toBe('/a.md');
    });
  });

  describe('switch', () => {
    it('有効なインデックスでタブを切り替える', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');
      await store.open('/b.md');

      store.switch(0);

      expect(store.activeIndex).toBe(0);
    });

    it('範囲外のインデックスは無視される', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('content');
      await store.open('/a.md');

      store.switch(5);

      expect(store.activeIndex).toBe(0);
    });
  });

  describe('syncFromActiveFile', () => {
    it('アクティブファイルのcontentとpathを同期する', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('# Hello');
      await store.open('/a.md');

      store.syncFromActiveFile();

      expect(store.localContent).toBe('# Hello');
      expect(store.filePath).toBe('/a.md');
    });
  });

  describe('updateLocalContent', () => {
    it('ローカルコンテンツを更新してisModifiedをtrueにする', async () => {
      const store = useEditorStore();
      mockElectronAPI.readFile.mockResolvedValue('original');
      await store.open('/a.md');

      store.updateLocalContent('modified');

      expect(store.localContent).toBe('modified');
      expect(store.openedFiles[0].isModified).toBe(true);
      expect(store.openedFiles[0].content).toBe('modified');
    });
  });

  describe('updatePreview', () => {
    it('markdownServiceを使ってプレビューを更新する', async () => {
      const store = useEditorStore();
      store.localContent = '# Hello';

      await store.updatePreview();

      expect(store.htmlPreview).toBe('<p>preview</p>');
    });

    it('localContentが空の場合はhtmlPreviewも空になる', async () => {
      const store = useEditorStore();
      store.localContent = '';

      await store.updatePreview();

      expect(store.htmlPreview).toBe('<p>preview</p>');
    });

    it('localContentがnullの場合はhtmlPreviewが空文字になる', async () => {
      const store = useEditorStore();
      store.localContent = null as unknown as string;

      await store.updatePreview();

      expect(store.htmlPreview).toBe('');
    });
  });
});
