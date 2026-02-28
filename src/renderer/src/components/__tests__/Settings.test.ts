import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import Settings from '../Settings.vue';
import { useWorkspaceStore } from '@renderer/store/workspace';

const mockElectronConfigAPI = {
  loadConfig: vi.fn(),
  saveConfig: vi.fn(),
  loadProjectConfig: vi.fn().mockResolvedValue({
    editorFontFamily: 'monospace',
    editorFontSize: 16,
    previewFontFamily: 'sans-serif',
    previewFontSize: 16
  }),
  saveProjectConfig: vi.fn().mockResolvedValue(undefined)
};

Object.defineProperty(window, 'electronConfigAPI', {
  value: mockElectronConfigAPI,
  writable: true
});

describe('Settings.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('isOpen=falseのとき表示されない', () => {
    const wrapper = mount(Settings, {
      props: { isOpen: false }
    });
    expect(wrapper.find('.modal-overlay').exists()).toBe(false);
  });

  it('isOpen=trueのときモーダルが表示される', () => {
    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });
    expect(wrapper.find('.modal-overlay').exists()).toBe(true);
    expect(wrapper.find('.modal-content').exists()).toBe(true);
  });

  it('設定フォームが正しい初期値を持つ', async () => {
    const store = useWorkspaceStore();
    store.rootPath = '/workspace';
    store.settings = {
      editorFontFamily: 'Consolas',
      editorFontSize: 14,
      previewFontFamily: 'Georgia',
      previewFontSize: 18
    };

    mockElectronConfigAPI.loadProjectConfig.mockResolvedValue({
      editorFontFamily: 'Consolas',
      editorFontSize: 14,
      previewFontFamily: 'Georgia',
      previewFontSize: 18
    });

    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });

    await flushPromises();

    const editorFontInput = wrapper.find('#editor-font-family');
    expect((editorFontInput.element as HTMLInputElement).value).toBe('Consolas');

    const editorSizeInput = wrapper.find('#editor-font-size');
    expect((editorSizeInput.element as HTMLInputElement).value).toBe('14');
  });

  it('キャンセルボタンでcloseイベントが発火する', async () => {
    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });

    await wrapper.find('.btn-secondary').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
    expect(wrapper.emitted('close')!.length).toBe(1);
  });

  it('保存ボタンでsaveProjectConfigが呼ばれcloseイベントが発火する', async () => {
    const store = useWorkspaceStore();
    store.rootPath = '/workspace';

    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });

    await wrapper.find('.btn-primary').trigger('click');
    await flushPromises();

    expect(mockElectronConfigAPI.saveProjectConfig).toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('オーバーレイクリックでcloseイベントが発火する', async () => {
    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });

    await wrapper.find('.modal-overlay').trigger('click');

    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('設定見出しが表示される', () => {
    const wrapper = mount(Settings, {
      props: { isOpen: true }
    });

    expect(wrapper.find('h2').text()).toBe('設定');
    expect(wrapper.findAll('h3').length).toBe(2);
  });
});
