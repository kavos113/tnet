<script setup lang="ts">
import { useWorkspaceStore } from '@renderer/store/workspace';
import { ref } from 'vue';
import { FileItem } from '@fixtures/file';
import FileTreeItem from './FileTreeItem.vue';
import { storeToRefs } from 'pinia';

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);
console.log(rootPath);

const fileTree = ref<FileItem[]>([
  {
    name: 'directory',
    path: 'directory',
    isDirectory: true,
    children: [
      {
        name: 'file.txt',
        path: 'directory/file.txt',
        isDirectory: false
      },
      {
        name: 'file2.txt',
        path: 'directory/file2.txt',
        isDirectory: false
      }
    ]
  },
  {
    name: 'directory2',
    path: 'directory2',
    isDirectory: true,
    children: []
  },
  {
    name: 'directory3',
    path: 'directory3',
    isDirectory: true,
    children: [
      {
        name: 'subdir',
        path: 'directory3/subdir',
        isDirectory: true,
        children: [
          {
            name: 'nestedfile.txt',
            path: 'directory3/subdir/nestedfile.txt',
            isDirectory: false
          }
        ]
      },
      {
        name: 'anotherfile.txt',
        path: 'directory3/anotherfile.txt',
        isDirectory: false
      },
      {
        name: 'yetanotherfile.txt',
        path: 'directory3/yetanotherfile.txt',
        isDirectory: false
      }
    ]
  },
  {
    name: 'file_at_root.txt',
    path: 'file_at_root.txt',
    isDirectory: false
  },
  {
    name: 'file5.txt',
    path: 'file5.txt',
    isDirectory: false
  }
]);
</script>

<template>
  <ul class="list">
    <FileTreeItem
      v-for="item in fileTree"
      :key="item.path"
      :item="item"
      :is-selected="false"
      :is-expand="false"
    />
  </ul>
</template>

<style scoped>
.list {
  list-style-type: none;
  margin: 0;
  padding: 0 0 0 0;
}
</style>
