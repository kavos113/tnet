<script setup lang="ts">
import { FileItem } from '@fixtures/file';
import { useExplorerStore } from '@renderer/store/explorer';
import 'material-icons/iconfont/material-icons.css';
import { storeToRefs } from 'pinia';
import { computed, inject, nextTick, ref, watch, type Ref } from 'vue';

type NewEntryMode = 'file' | 'directory';

type NewEntryState = {
  isActive: boolean;
  mode: NewEntryMode;
  parentPath: string | null;
  name: string;
};

type NewEntryContext = {
  state: Ref<NewEntryState>;
  confirm: () => Promise<void>;
  cancel: () => void;
};

type RenameEntryState = {
  isActive: boolean;
  targetPath: string | null;
  name: string;
};

type RenameEntryContext = {
  state: Ref<RenameEntryState>;
  confirm: () => Promise<void>;
  cancel: () => void;
};

const props = defineProps<{
  item: FileItem;
}>();

const store = useExplorerStore();
const { selectedPath, selectedDirPath, expandPaths } = storeToRefs(store);

const isExpand = computed(() => {
  return expandPaths.value.has(props.item.path);
});

const isSelected = computed(() => {
  return props.item.path === (selectedPath.value ?? selectedDirPath.value);
});

const newEntry = inject<NewEntryContext | null>('newEntry', null);
const renameEntry = inject<RenameEntryContext | null>('renameEntry', null);
const inputRef = ref<HTMLInputElement | null>(null);
const renameInputRef = ref<HTMLInputElement | null>(null);

const shouldShowNewEntryHere = computed(() => {
  if (!newEntry?.state.value.isActive) return false;
  return newEntry.state.value.parentPath === props.item.path;
});

const shouldShowRenameHere = computed(() => {
  if (!renameEntry?.state.value.isActive) return false;
  return renameEntry.state.value.targetPath === props.item.path;
});

watch(
  () => shouldShowNewEntryHere.value,
  async (visible) => {
    if (visible) {
      await nextTick();
      inputRef.value?.focus();
      inputRef.value?.select();
    }
  }
);

watch(
  () => shouldShowRenameHere.value,
  async (visible) => {
    if (visible) {
      await nextTick();
      renameInputRef.value?.focus();
      renameInputRef.value?.select();
    }
  }
);

const handleClick = (): void => {
  if (props.item.isDirectory) {
    store.selectedPath = null;
    store.selectedDirPath = props.item.path;
    if (isExpand.value) store.expandPaths.delete(props.item.path);
    else store.expandPaths.add(props.item.path);
  } else {
    store.selectedDirPath = null;
    store.selectedPath = props.item.path;
  }
};

const onNewEntryKeydown = async (event: KeyboardEvent): Promise<void> => {
  if (!newEntry) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    await newEntry.confirm();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    newEntry.cancel();
  }
};

const onRenameKeydown = async (event: KeyboardEvent): Promise<void> => {
  if (!renameEntry) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    await renameEntry.confirm();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    renameEntry.cancel();
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
      <input
        v-if="shouldShowRenameHere"
        ref="renameInputRef"
        v-model="renameEntry!.state.value.name"
        class="file-item-new-input"
        @keydown="onRenameKeydown"
        @blur="renameEntry!.cancel"
      />
      <p
        v-else
        class="file-item-name"
        :class="{ 'file-item-not-directory': !props.item.isDirectory }"
      >
        {{ props.item.name }}
      </p>
    </div>
    <ul v-if="props.item.isDirectory && props.item.children && isExpand" class="file-item-children">
      <li v-if="shouldShowNewEntryHere" class="file-item-new">
        <div class="file-tree-item">
          <span class="material-icons-round file-item-chevron file-item-icon-placeholder"
            >chevron_right</span
          >
          <span
            class="material-icons file-item-folder"
            :class="{ 'file-item-icon-placeholder': newEntry?.state.value.mode !== 'directory' }"
            >folder</span
          >
          <input
            ref="inputRef"
            v-model="newEntry!.state.value.name"
            class="file-item-new-input"
            @keydown="onNewEntryKeydown"
            @blur="newEntry!.cancel"
          />
        </div>
      </li>
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

.file-tree-item:hover {
  background-color: var(--gray);
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

.file-item-new {
  list-style-type: none;
}

.file-item-new-input {
  width: 100%;
  min-width: 0;
}

.file-item-icon-placeholder {
  visibility: hidden;
}
</style>
