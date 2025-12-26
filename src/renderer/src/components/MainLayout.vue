<script setup lang="ts">
import { watch } from 'vue';
import MarkdownEditor from './editor/MarkdownEditor.vue';
import TabBar from './editor/TabBar.vue';
import FileExplorer from './explorer/FileExplorer.vue';
import { useExplorerStore } from '@renderer/store/explorer';
import { storeToRefs } from 'pinia';
import { useEditorStore } from '@renderer/store/editor';

const explorerStore = useExplorerStore();
const { selectedPath } = storeToRefs(explorerStore);

const editorStore = useEditorStore();
const { activeIndex } = storeToRefs(editorStore);

watch(selectedPath, (newPath) => {
  if (newPath) {
    editorStore.open(newPath);
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
