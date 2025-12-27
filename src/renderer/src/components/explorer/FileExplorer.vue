<script setup lang="ts">
import { useWorkspaceStore } from '@renderer/store/workspace';
import { computed, onBeforeUnmount, onMounted, provide, ref } from 'vue';
import { FileItem } from '@fixtures/file';
import FileTreeItem from './FileTreeItem.vue';
import { storeToRefs } from 'pinia';
import { useExplorerStore } from '@renderer/store/explorer';
import { useEditorStore } from '@renderer/store/editor';

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);

const explorerStore = useExplorerStore();
const editorStore = useEditorStore();

const fileItemTree = ref<FileItem[]>([]);

type NewEntryMode = 'file' | 'directory';
type NewEntryState = {
  isActive: boolean;
  mode: NewEntryMode;
  parentPath: string | null;
  name: string;
};

const newEntry = ref<NewEntryState>({
  isActive: false,
  mode: 'file',
  parentPath: null,
  name: ''
});

const rootInputRef = ref<HTMLInputElement | null>(null);

type RenameEntryState = {
  isActive: boolean;
  targetPath: string | null;
  name: string;
};

const renameEntry = ref<RenameEntryState>({
  isActive: false,
  targetPath: null,
  name: ''
});

const flattenTree = (items: FileItem[]): Map<string, FileItem> => {
  const map = new Map<string, FileItem>();
  const stack = [...items];
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    map.set(item.path, item);
    if (item.isDirectory && item.children) {
      for (const child of item.children) stack.push(child);
    }
  }
  return map;
};

const itemByPath = computed(() => flattenTree(fileItemTree.value));

const normalizeSep = (p: string): string => (p.includes('\\') ? '\\' : '/');
const dirname = (p: string): string => p.replace(/[\\/][^\\/]*$/, '');
const joinPath = (parent: string, name: string): string => {
  const sep = normalizeSep(parent);
  if (parent.endsWith(sep)) return `${parent}${name}`;
  return `${parent}${sep}${name}`;
};

const basename = (p: string): string => {
  const sep = p.includes('\\') ? '\\' : '/';
  const parts = p.split(sep);
  return parts[parts.length - 1] ?? p;
};

const resolveTargetDir = (): string | null => {
  const selectedDir = explorerStore.selectedDirPath;
  const selectedFile = explorerStore.selectedPath;
  if (!rootPath.value) return null;
  if (selectedDir) return selectedDir;
  if (!selectedFile) return rootPath.value;

  const item = itemByPath.value.get(selectedFile);
  if (item?.isDirectory) return item.path;
  return dirname(selectedFile);
};

const cancelNewEntry = (): void => {
  newEntry.value.isActive = false;
  newEntry.value.name = '';
  newEntry.value.parentPath = null;
};

const cancelRenameEntry = (): void => {
  renameEntry.value.isActive = false;
  renameEntry.value.targetPath = null;
  renameEntry.value.name = '';
};

const reloadTree = async (): Promise<void> => {
  if (!rootPath.value) return;
  fileItemTree.value = await window.electronAPI.getFileTree(rootPath.value);
};

const confirmNewEntry = async (): Promise<void> => {
  if (!newEntry.value.isActive) return;
  if (!rootPath.value) return;

  const parent = newEntry.value.parentPath ?? rootPath.value;
  let name = newEntry.value.name.trim();
  if (!name) return;
  if (/[\\/]/.test(name)) return;

  if (newEntry.value.mode === 'file' && !name.toLowerCase().endsWith('.md')) {
    name = `${name}.md`;
  }

  const fullPath = joinPath(parent, name);

  try {
    if (newEntry.value.mode === 'directory') {
      await window.electronAPI.createDirectory(fullPath);
      explorerStore.selectedPath = null;
      explorerStore.selectedDirPath = fullPath;
      explorerStore.expandPaths.add(parent);
    } else {
      await window.electronAPI.createFile(fullPath);
      explorerStore.selectedDirPath = null;
      explorerStore.selectedPath = fullPath;
    }
    cancelNewEntry();
    await reloadTree();
  } catch (err) {
    console.error('error creating entry', err);
  }
};

const startNewEntry = async (mode: NewEntryMode): Promise<void> => {
  if (!rootPath.value) return;
  const targetDir = resolveTargetDir();
  if (!targetDir) return;

  newEntry.value.isActive = true;
  newEntry.value.mode = mode;
  newEntry.value.parentPath = targetDir === rootPath.value ? null : targetDir;
  newEntry.value.name = mode === 'directory' ? 'New Folder' : 'New File';

  if (newEntry.value.parentPath) {
    let current: string | null = newEntry.value.parentPath;
    while (current) {
      explorerStore.expandPaths.add(current);
      if (current === rootPath.value) break;
      const next = dirname(current);
      if (!next || next === current) break;
      current = next;
    }
  }
  if (newEntry.value.parentPath === null) {
    await Promise.resolve();
    rootInputRef.value?.focus();
    rootInputRef.value?.select();
  }
};

const shouldShowNewEntryAtRoot = computed(() => {
  return newEntry.value.isActive && newEntry.value.parentPath === null && rootPath.value !== '';
});

const onRootNewEntryKeydown = async (event: KeyboardEvent): Promise<void> => {
  if (event.key === 'Enter') {
    event.preventDefault();
    await confirmNewEntry();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    cancelNewEntry();
  }
};

const onGlobalKeydown = async (event: KeyboardEvent): Promise<void> => {
  const target = event.target as HTMLElement | null;
  const tagName = target?.tagName?.toLowerCase();
  const isEditable =
    tagName === 'input' || tagName === 'textarea' || (target ? target.isContentEditable : false);
  if (isEditable) return;

  if (event.key === 'Delete') {
    if (explorerStore.selectedPath) {
      event.preventDefault();
      try {
        const path = explorerStore.selectedPath;
        await window.electronAPI.deleteFile(path, rootPath.value);
        editorStore.closeByPath(path);
        explorerStore.selectedPath = null;
        await reloadTree();
      } catch (err) {
        console.error('error deleting file', err);
      }
    }
    return;
  }

  if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'r') {
    const targetPath = explorerStore.selectedPath ?? explorerStore.selectedDirPath;
    if (!targetPath) return;
    event.preventDefault();
    renameEntry.value.isActive = true;
    renameEntry.value.targetPath = targetPath;
    renameEntry.value.name = basename(targetPath);
    return;
  }

  const isCmdOrCtrl = event.ctrlKey || event.metaKey;
  if (isCmdOrCtrl && event.key.toLowerCase() === 'n') {
    event.preventDefault();
    await startNewEntry(event.shiftKey ? 'directory' : 'file');
  }
};

const confirmRenameEntry = async (): Promise<void> => {
  if (!renameEntry.value.isActive || !renameEntry.value.targetPath) return;
  if (!rootPath.value) return;

  const oldPath = renameEntry.value.targetPath;
  const parent = dirname(oldPath);
  const name = renameEntry.value.name.trim();
  if (!name) return;
  if (/[\\/]/.test(name)) return;

  const newPath = joinPath(parent, name);
  if (newPath === oldPath) {
    cancelRenameEntry();
    return;
  }

  try {
    await window.electronAPI.renamePath(oldPath, newPath, rootPath.value);
    editorStore.renameOpenedPath(oldPath, newPath);

    if (explorerStore.selectedPath === oldPath) explorerStore.selectedPath = newPath;
    if (explorerStore.selectedDirPath === oldPath) explorerStore.selectedDirPath = newPath;

    cancelRenameEntry();
    await reloadTree();
  } catch (err) {
    console.error('error renaming path', err);
  }
};

provide('newEntry', {
  state: newEntry,
  confirm: confirmNewEntry,
  cancel: cancelNewEntry
});

provide('renameEntry', {
  state: renameEntry,
  confirm: confirmRenameEntry,
  cancel: cancelRenameEntry
});

onMounted(async () => {
  try {
    const config = await window.electronConfigAPI.loadConfig();
    if (config.lastOpenedDirectory) {
      workspaceStore.rootPath = config.lastOpenedDirectory;

      const fileTree = await window.electronAPI.getFileTree(config.lastOpenedDirectory);
      fileItemTree.value = fileTree;
    }
  } catch {
    console.log('error loading config');
  }

  window.addEventListener('keydown', onGlobalKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown);
});

const openFolder = async (): Promise<void> => {
  try {
    const { rootPath, fileTree } = await window.electronAPI.getNewFileTree();
    fileItemTree.value = fileTree;
    workspaceStore.rootPath = rootPath;

    await window.electronConfigAPI.saveConfig({
      lastOpenedDirectory: rootPath
    });
  } catch {
    console.error('error in selecting workspace');
  }
};
</script>

<template>
  <div v-if="rootPath === ''">
    <p>フォルダが選択されていません</p>
    <button class="open-folder-button" @click="openFolder">フォルダを開く</button>
  </div>
  <div v-else>
    <ul class="list">
      <li v-if="shouldShowNewEntryAtRoot" class="file-item-new">
        <div class="file-tree-item">
          <span class="material-icons-round file-item-chevron file-item-icon-placeholder"
            >chevron_right</span
          >
          <span
            class="material-icons file-item-folder"
            :class="{ 'file-item-icon-placeholder': newEntry.mode !== 'directory' }"
            >folder</span
          >
          <input
            ref="rootInputRef"
            v-model="newEntry.name"
            class="file-item-new-input"
            @keydown="onRootNewEntryKeydown"
            @blur="cancelNewEntry"
          />
        </div>
      </li>
      <FileTreeItem v-for="item in fileItemTree" :key="item.path" :item="item" />
    </ul>
  </div>
</template>

<style scoped>
.list {
  list-style-type: none;
  margin: 0;
  padding: 0 0 0 0;
}

.open-folder-button {
  padding: 8px 16px;
  background-color: var(--main-dark);
  color: var(--background);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.file-item-new {
  list-style-type: none;
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 2px;
}

.file-item-chevron {
  font-size: 12px;
}

.file-item-folder {
  color: var(--folder);
  font-size: 12px;
}

.file-item-name {
  margin: 0;
}

.file-item-not-directory {
  padding-left: 28px;
}

.file-item-new-input {
  width: 100%;
  min-width: 0;
}

.file-item-icon-placeholder {
  visibility: hidden;
}
</style>
