<script setup lang="ts">
import { watch } from 'vue';
import MarkdownEditor from './editor/MarkdownEditor.vue';
import TabBar from './editor/TabBar.vue';
import FileExplorer from './explorer/FileExplorer.vue';
import { useExplorerStore } from '@renderer/store/explorer';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';

const explorerStore = useExplorerStore();
const { selectedPath } = storeToRefs(explorerStore);

const editorStore = useEditorStore();
const { openedFiles, activeIndex } = storeToRefs(editorStore);

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);

watch(selectedPath, async (newPath) => {
  if (newPath) {
    editorStore.open(newPath);

    const openedPaths = openedFiles.value.map((file) => file.path);
    await window.electronAPI.saveSession(rootPath.value, openedPaths);
  }
});

watch(rootPath, async (newPath) => {
  if (newPath !== '') {
    const filePaths = await window.electronAPI.loadSession(rootPath.value);
    if (filePaths && filePaths.length > 0) {
      for (const path of filePaths) {
        editorStore.open(path);
      }
    }
  }

  try {
    const settings = await window.electronConfigAPI.loadProjectConfig(rootPath.value);
    workspaceStore.settings = settings;
  } catch {
    console.error('failed to load settings');
  }
});
</script>
<template>
  <div class="main-area">
    <div class="sidebar">
      <FileExplorer />
    </div>
    <div class="main-content">
      <TabBar />
      <div v-if="activeIndex >= 0" class="editor-container">
        <MarkdownEditor />
      </div>
      <div v-else>
        <p>No Contents Selected</p>
      </div>
    </div>
  </div>
</template>

<style>
.main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.sidebar {
  width: 250px;
  display: flex;
  flex-direction: column;
  background-color: var(--backgound-dark);
  border-right: 1px solid var(--gray);
  overflow: auto;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: calc(100% - 40px);
}
</style>
