import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FileTreeItem from '../FileTreeItem.vue';
import { useExplorerStore } from '@renderer/store/explorer';

describe('FileTreeItem.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('ファイルの名前を表示する', () => {
    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'test.md',
          path: '/test.md',
          isDirectory: false
        }
      }
    });

    expect(wrapper.find('.file-item-name').text()).toBe('test.md');
  });

  it('ディレクトリの場合はフォルダアイコンとシェブロンを表示する', () => {
    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: []
        }
      }
    });

    expect(wrapper.find('.file-item-chevron').exists()).toBe(true);
    expect(wrapper.find('.file-item-folder').exists()).toBe(true);
    expect(wrapper.find('.file-item-folder').text()).toBe('folder');
  });

  it('ファイルの場合はシェブロンとフォルダアイコンを表示しない', () => {
    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'test.md',
          path: '/test.md',
          isDirectory: false
        }
      }
    });

    expect(wrapper.find('.file-item-chevron').exists()).toBe(false);
    expect(wrapper.find('.file-item-folder').exists()).toBe(false);
  });

  it('ファイルをクリックするとselectedPathが更新される', async () => {
    const store = useExplorerStore();

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'test.md',
          path: '/test.md',
          isDirectory: false
        }
      }
    });

    await wrapper.find('.file-tree-item').trigger('click');

    expect(store.selectedPath).toBe('/test.md');
    expect(store.selectedDirPath).toBeNull();
  });

  it('ディレクトリをクリックするとselectedDirPathが更新されexpandPathsに追加される', async () => {
    const store = useExplorerStore();

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: []
        }
      }
    });

    await wrapper.find('.file-tree-item').trigger('click');

    expect(store.selectedDirPath).toBe('/docs');
    expect(store.selectedPath).toBeNull();
    expect(store.expandPaths.has('/docs')).toBe(true);
  });

  it('展開されたディレクトリをクリックすると折りたたまれる', async () => {
    const store = useExplorerStore();
    store.expandPaths.add('/docs');

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: []
        }
      }
    });

    await wrapper.find('.file-tree-item').trigger('click');

    expect(store.expandPaths.has('/docs')).toBe(false);
  });

  it('展開状態のディレクトリはfolder_openアイコンを表示する', () => {
    const store = useExplorerStore();
    store.expandPaths.add('/docs');

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: []
        }
      }
    });

    expect(wrapper.find('.file-item-folder').text()).toBe('folder_open');
  });

  it('展開されたディレクトリの子要素が表示される', () => {
    const store = useExplorerStore();
    store.expandPaths.add('/docs');

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'docs',
          path: '/docs',
          isDirectory: true,
          children: [{ name: 'child.md', path: '/docs/child.md', isDirectory: false }]
        }
      }
    });

    expect(wrapper.find('.file-item-children').exists()).toBe(true);
    expect(wrapper.findAll('.file-item-name').length).toBe(2);
  });

  it('選択されたアイテムにis-selectedクラスが付与される', () => {
    const store = useExplorerStore();
    store.selectedPath = '/test.md';

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'test.md',
          path: '/test.md',
          isDirectory: false
        }
      }
    });

    expect(wrapper.find('.file-item-is-selected').exists()).toBe(true);
  });

  it('選択されていないアイテムにis-selectedクラスが付与されない', () => {
    const store = useExplorerStore();
    store.selectedPath = '/other.md';

    const wrapper = mount(FileTreeItem, {
      props: {
        item: {
          name: 'test.md',
          path: '/test.md',
          isDirectory: false
        }
      }
    });

    expect(wrapper.find('.file-item-is-selected').exists()).toBe(false);
  });
});
