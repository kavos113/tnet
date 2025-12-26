<script setup lang="ts">
import { FileItem } from '@fixtures/file';
import { useExplorerStore } from '@renderer/store/explorer';
import 'material-icons/iconfont/material-icons.css';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';

const props = defineProps<{
  item: FileItem;
}>();

const store = useExplorerStore();
const { selectedPath, expandPaths } = storeToRefs(store);

const isExpand = computed(() => {
  return expandPaths.value.has(props.item.path);
});

const isSelected = computed(() => {
  return props.item.path === selectedPath.value;
});

const handleClick = (): void => {
  if (props.item.isDirectory) {
    if (isExpand.value) {
      store.expandPaths.delete(props.item.path);
    } else {
      store.expandPaths.add(props.item.path);
    }
  } else {
    store.selectedPath = props.item.path;
  }
};
</script>

<template>
  <li>
    <div
      class="file-tree-item"
      :class="{ 'file-item-is-selected': isSelected }"
      @click="handleClick"
    >
      <span
        v-if="props.item.isDirectory"
        class="material-icons-round file-item-chevron"
        :class="{ 'file-item-chevron-expand': isExpand }"
        >chevron_right</span
      >
      <span v-if="props.item.isDirectory" class="material-icons file-item-folder">
        {{ isExpand ? 'folder_open' : 'folder' }}
      </span>
      <p class="file-item-name" :class="{ 'file-item-not-directory': !props.item.isDirectory }">
        {{ props.item.name }}
      </p>
    </div>
    <ul v-if="props.item.isDirectory && props.item.children && isExpand" class="file-item-children">
      <FileTreeItem v-for="child in props.item.children" :key="child.path" :item="child" />
    </ul>
  </li>
</template>

<style>
.file-item-folder {
  color: var(--folder);
  font-size: 12px;
}

.file-item-chevron {
  font-size: 12px;
}

.file-item-chevron-expand {
  transform: rotate(90deg);
}

.file-tree-item {
  display: flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
}

.file-item-name {
  margin: 0;
}

.file-item-not-directory {
  padding-left: 28px;
}

.file-item-children {
  list-style-type: none;
  margin: 0;
  padding: 0 0 0 12px;
}

.file-item-is-selected {
  background-color: var(--main-light);
}
</style>
