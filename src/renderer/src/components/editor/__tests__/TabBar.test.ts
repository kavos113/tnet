import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TabBar from '../TabBar.vue';
import { useEditorStore } from '@renderer/store/editor';

vi.mock('@renderer/services/markdownService', () => ({
  markdownService: {
    parse: vi.fn().mockResolvedValue(''),
    renderMermaidDiagrams: vi.fn()
  }
}));

describe('TabBar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('openedFilesが空の場合はタブバーを表示しない', () => {
    const wrapper = mount(TabBar);
    expect(wrapper.find('.tab-bar').exists()).toBe(false);
  });

  it('openedFilesに応じてタブを表示する', () => {
    const store = useEditorStore();
    store.openedFiles = [
      { path: '/a.md', content: '', isModified: false, displayName: 'a.md' },
      { path: '/b.md', content: '', isModified: false, displayName: 'b.md' }
    ];

    const wrapper = mount(TabBar);
    const tabs = wrapper.findAll('.tab');

    expect(tabs).toHaveLength(2);
    expect(tabs[0].text()).toContain('a.md');
    expect(tabs[1].text()).toContain('b.md');
  });

  it('アクティブタブにactiveクラスが付与される', () => {
    const store = useEditorStore();
    store.openedFiles = [
      { path: '/a.md', content: '', isModified: false, displayName: 'a.md' },
      { path: '/b.md', content: '', isModified: false, displayName: 'b.md' }
    ];
    store.activeIndex = 1;

    const wrapper = mount(TabBar);
    const tabs = wrapper.findAll('.tab');

    expect(tabs[0].classes()).not.toContain('active');
    expect(tabs[1].classes()).toContain('active');
  });

  it('変更されたファイルに変更インジケーターが表示される', () => {
    const store = useEditorStore();
    store.openedFiles = [{ path: '/a.md', content: '', isModified: true, displayName: 'a.md' }];

    const wrapper = mount(TabBar);

    expect(wrapper.find('.modified-indicator').exists()).toBe(true);
    expect(wrapper.find('.modified-indicator').text()).toBe('●');
  });

  it('タブをクリックするとswitchが呼ばれる', async () => {
    const store = useEditorStore();
    store.openedFiles = [
      { path: '/a.md', content: '', isModified: false, displayName: 'a.md' },
      { path: '/b.md', content: '', isModified: false, displayName: 'b.md' }
    ];
    store.activeIndex = 0;

    const wrapper = mount(TabBar);
    const tabs = wrapper.findAll('.tab');
    await tabs[1].trigger('click');

    expect(store.activeIndex).toBe(1);
  });

  it('閉じるボタンをクリックするとcloseが呼ばれる', async () => {
    const store = useEditorStore();
    store.openedFiles = [
      { path: '/a.md', content: '', isModified: false, displayName: 'a.md' },
      { path: '/b.md', content: '', isModified: false, displayName: 'b.md' }
    ];
    store.activeIndex = 0;

    const wrapper = mount(TabBar);
    const closeButtons = wrapper.findAll('.tab-close');
    await closeButtons[0].trigger('click');

    expect(store.openedFiles).toHaveLength(1);
    expect(store.openedFiles[0].path).toBe('/b.md');
  });
});
