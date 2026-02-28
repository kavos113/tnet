import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useWorkspaceStore } from '../workspace';

const mockElectronConfigAPI = {
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  loadProjectConfig: vi.fn(),
  saveProjectConfig: vi.fn().mockResolvedValue(undefined)
};

Object.defineProperty(window, 'electronConfigAPI', {
  value: mockElectronConfigAPI,
  writable: true
});

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('デフォルト値が正しい', () => {
      const store = useWorkspaceStore();
      expect(store.rootPath).toBe('');
      expect(store.settings).toEqual({
        editorFontFamily: 'monospace',
        editorFontSize: 16,
        previewFontFamily: 'sans-serif',
        previewFontSize: 16
      });
    });
  });

  describe('rootPath', () => {
    it('パスを設定できる', () => {
      const store = useWorkspaceStore();
      store.rootPath = '/workspace';
      expect(store.rootPath).toBe('/workspace');
    });
  });

  describe('settings', () => {
    it('設定を変更できる', () => {
      const store = useWorkspaceStore();
      store.settings = {
        editorFontFamily: 'Consolas',
        editorFontSize: 14,
        previewFontFamily: 'Georgia',
        previewFontSize: 18
      };
      expect(store.settings.editorFontFamily).toBe('Consolas');
      expect(store.settings.editorFontSize).toBe(14);
    });
  });

  describe('saveSettings', () => {
    it('設定を保存してelectronConfigAPI.saveProjectConfigを呼ぶ', async () => {
      const store = useWorkspaceStore();
      store.rootPath = '/workspace';

      const newSettings = {
        editorFontFamily: 'Consolas',
        editorFontSize: 14,
        previewFontFamily: 'Georgia',
        previewFontSize: 18
      };

      await store.saveSettings(newSettings);

      expect(store.settings).toEqual(newSettings);
      expect(mockElectronConfigAPI.saveProjectConfig).toHaveBeenCalledWith(
        '/workspace',
        newSettings
      );
    });
  });
});
