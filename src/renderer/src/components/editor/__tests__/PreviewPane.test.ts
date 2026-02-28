import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PreviewPane from '../PreviewPane.vue';
import { useEditorStore } from '@renderer/store/editor';

vi.mock('@renderer/services/markdownService', () => ({
  markdownService: {
    parse: vi.fn().mockResolvedValue('<p>parsed</p>'),
    renderMermaidDiagrams: vi.fn()
  }
}));

const mockElectronAPI = {
  readFile: vi.fn(),
  getKeywordContent: vi.fn(),
  writeFile: vi.fn(),
  getFileTree: vi.fn(),
  getNewFileTree: vi.fn(),
  createFile: vi.fn(),
  createDirectory: vi.fn(),
  deleteFile: vi.fn(),
  renamePath: vi.fn(),
  saveSession: vi.fn(),
  loadSession: vi.fn(),
  loadKeywords: vi.fn()
};

Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true });

describe('PreviewPane.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('htmlPreviewの内容をレンダリングする', () => {
    const store = useEditorStore();
    store.htmlPreview = '<p>Hello World</p>';

    const wrapper = mount(PreviewPane);

    expect(wrapper.find('.markdown-preview').exists()).toBe(true);
    expect(wrapper.find('.markdown-preview').html()).toContain('Hello World');
  });

  it('htmlPreviewが空の場合も正しくレンダリングされる', () => {
    const store = useEditorStore();
    store.htmlPreview = '';

    const wrapper = mount(PreviewPane);

    expect(wrapper.find('.markdown-preview').exists()).toBe(true);
  });

  it('getPreviewElementがDOM要素を返す', () => {
    const store = useEditorStore();
    store.htmlPreview = '<p>test</p>';

    const wrapper = mount(PreviewPane);
    const vm = wrapper.vm as unknown as { getPreviewElement: () => HTMLElement | undefined };
    const el = vm.getPreviewElement();

    expect(el).toBeDefined();
    expect(el?.classList.contains('markdown-preview')).toBe(true);
  });

  it('ツールチップは初期状態で非表示', () => {
    const store = useEditorStore();
    store.htmlPreview = '';

    const wrapper = mount(PreviewPane);

    expect(wrapper.find('.internal-link-tooltip').exists()).toBe(false);
  });
});
