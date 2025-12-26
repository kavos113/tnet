<script setup lang="ts">
import MarkdownEditor from './editor/MarkdownEditor.vue';
import TabBar from './editor/TabBar.vue';
import FileExplorer from './explorer/FileExplorer.vue';
</script>
<template>
  <div class="main-area">
    <div class="sidebar">
      <FileExplorer />
    </div>
    <div class="main-content">
      <TabBar />
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
}

.sidebar {
  width: 250px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--backgound-dark);
  border-right: 1px solid var(--gray);
  overflow: hidden;
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
