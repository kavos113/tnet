<script setup lang="ts">
import { useWorkspaceStore } from '@renderer/store/workspace';
import { onMounted, ref } from 'vue';
import { FileItem } from '@fixtures/file';
import FileTreeItem from './FileTreeItem.vue';
import { storeToRefs } from 'pinia';

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);

const fileItemTree = ref<FileItem[]>([]);

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
      <FileTreeItem
        v-for="item in fileItemTree"
        :key="item.path"
        :item="item"
        :is-selected="false"
        :is-expand="false"
      />
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
</style>
