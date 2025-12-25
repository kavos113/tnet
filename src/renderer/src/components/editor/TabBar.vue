<script setup lang="ts">
import { OpenFile, useEditorStore } from '@renderer/store/editor';
import { storeToRefs } from 'pinia';

const store = useEditorStore();
const { openedFiles, activeIndex } = storeToRefs(store);

const getDisplayName = (filePath: string): string => {
  const fileName = filePath.includes('\\') ? filePath.split('\\').pop() : filePath.split('/').pop();
  return fileName ? fileName : filePath;
};

const openFileInTab = async (filePath: string): Promise<void> => {
  try {
    const existingIndex = openedFiles.value.findIndex((file) => file.path == filePath);
    if (existingIndex !== -1) {
      store.activeIndex = existingIndex;
      return;
    }

    const content = await window.electronAPI.readFile(filePath);

    const newFile: OpenFile = {
      path: filePath,
      content: content,
      isModified: false,
      displayName: getDisplayName(filePath)
    };

    store.openedFiles.push(newFile);
    store.activeIndex = openedFiles.value.length - 1;
  } catch (err) {
    console.error('error in reading files', err);

    const newFile: OpenFile = {
      path: filePath,
      content: 'error: reading file',
      isModified: false,
      displayName: getDisplayName(filePath)
    };
    store.openedFiles.push(newFile);
    store.activeIndex = openedFiles.value.length - 1;
  }
};

const closeTab = (index: number): void => {
  if (index < 0 || index >= openedFiles.value.length) return;

  store.openedFiles.splice(index, 1);

  if (openedFiles.value.length === 0) {
    store.activeIndex = -1;
  } else if (index <= activeIndex.value) {
    if (activeIndex.value > 0) {
      store.activeIndex--;
    } else {
      store.activeIndex = 0;
    }
  }
};

const switchTab = (index: number): void => {
  if (index >= 0 && index < openedFiles.value.length) {
    store.activeIndex = index;
  }
};

defineExpose({
  openFileInTab
});
</script>

<template>
  <div v-if="openedFiles.length > 0" class="tab-bar">
    <div
      v-for="(file, index) in openedFiles"
      :key="file.path"
      class="tab"
      :class="{ active: index == activeIndex }"
      @click="switchTab(index)"
    >
      <span class="tab-name">{{ file.displayName }}</span>
      <span v-if="file.isModified" class="modified-indicator">●</span>
      <button class="tab-close" @click.stop="closeTab(index)">×</button>
    </div>
  </div>
</template>

<style scoped>
.tab-bar {
  display: flex;
  background-color: var(--tab-bg);
  border-bottom: 1px solid var(--tab-border);
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
  height: 40px;
  white-space: nowrap;
}

.tab-bar::-webkit-scrollbar {
  height: 3px;
}

.tab-bar::-webkit-scrollbar-track {
  background: var(--tab-bg);
}

.tab-bar::-webkit-scrollbar-thumb {
  background: var(--gray);
  border-radius: 3px;
}

.tab-bar::-webkit-scrollbar-thumb:hover {
  background: var(--foreground);
}

.tab {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: var(--tab-bg);
  border-right: 1px solid var(--tab-border);
  cursor: pointer;
  user-select: none;
  min-width: 120px;
  max-width: 200px;
  transition: background-color 0.2s;
  position: relative;
  flex-shrink: 0;
}

.tab:hover {
  background-color: var(--tab-hover-bg);
}

.tab.active {
  background-color: var(--tab-active-bg);
  border-bottom: 2px solid var(--main-dark);
  margin-bottom: -1px;
}

.tab-name {
  flex: 1;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 8px;
  color: var(--foreground);
}

.tab.active .tab-name {
  font-weight: 500;
}

.modified-indicator {
  color: var(--tab-modified);
  font-size: 12px;
  margin-right: 4px;
  font-weight: bold;
}

.tab-close {
  background: none;
  border: none;
  color: var(--foreground);
  cursor: pointer;
  font-size: 16px;
  padding: 2px 4px;
  border-radius: 3px;
  opacity: 0.6;
  transition:
    opacity 0.2s,
    background-color 0.2s;
  margin-left: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-close:hover {
  opacity: 1;
  background-color: var(--hover-bg);
}

.tab.active .tab-close {
  opacity: 0.8;
}
</style>
