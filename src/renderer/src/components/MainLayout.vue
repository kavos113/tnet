<script setup lang="ts">
import { ref, watch } from 'vue';
import MarkdownEditor from './editor/MarkdownEditor.vue';
import TabBar from './editor/TabBar.vue';
import FileExplorer from './explorer/FileExplorer.vue';
import { useExplorerStore } from '@renderer/store/explorer';
import { storeToRefs } from 'pinia';

const tabBarRef = ref<InstanceType<typeof TabBar> | null>(null);

const explorerStore = useExplorerStore();
const { selectedPath } = storeToRefs(explorerStore);

watch(selectedPath, (newPath) => {
  if (tabBarRef.value) {
    if (newPath !== null) {
      tabBarRef.value.openFileInTab(newPath);
    }
  }
});
</script>
<template>
  <div class="main-area">
    <div class="sidebar">
      <FileExplorer />
    </div>
    <div class="main-content">
      <TabBar ref="tabBarRef" />
      <div class="editor-container">
        <MarkdownEditor />
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
