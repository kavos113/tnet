<script setup lang="ts">
import EditorPane from '@renderer/components/editor/EditorPane.vue';
import PreviewPane from '@renderer/components/editor/PreviewPane.vue';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { onMounted, onUnmounted, ref, watch } from 'vue';

const store = useEditorStore();
const { openedFiles, activeIndex, viewMode, localContent, filePath } = storeToRefs(store);

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);

const editorPaneRef = ref<InstanceType<typeof EditorPane>>();
const previewPaneRef = ref<InstanceType<typeof PreviewPane>>();

const isSaving = ref<boolean>(false);
const isResizing = ref<boolean>(false);
const editorWidth = ref<number>(50);
const isSyncingScroll = ref<boolean>(false);

watch(
  activeIndex,
  () => {
    store.syncFromActiveFile();
  },
  { immediate: true }
);

watch(
  localContent,
  async () => {
    await store.updatePreview();
  },
  { immediate: true }
);

const saveFile = async (): Promise<void> => {
  if (activeIndex.value < 0 || activeIndex.value >= openedFiles.value.length || isSaving.value) {
    return;
  }

  try {
    isSaving.value = true;
    await window.electronAPI.writeFile(
      openedFiles.value[activeIndex.value].path,
      localContent.value,
      rootPath.value
    );
    const content = await window.electronAPI.readFile(openedFiles.value[activeIndex.value].path);
    store.updateLocalContent(content);
    editorPaneRef.value?.updateContent(content);
    store.openedFiles[activeIndex.value].isModified = false;
  } catch (err) {
    console.error('error saving file', err);
  } finally {
    isSaving.value = false;
  }
};

const handleKeyDown = async (event: KeyboardEvent): Promise<void> => {
  if (event.ctrlKey && event.key === 's') {
    event.preventDefault();
    await saveFile();
  }
};

const startResize = (event: MouseEvent): void => {
  event.preventDefault();
  isResizing.value = true;

  const target = event.currentTarget as HTMLElement;
  const container = target.parentElement as HTMLElement;
  const containerRect = container.getBoundingClientRect();

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isResizing.value) return;

    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    editorWidth.value = Math.min(Math.max(newWidth, 20), 80);
  };

  const handleMouseUp = (): void => {
    isResizing.value = false;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
};

const getEditorWidth = (): string => {
  if (viewMode.value === 'editor') {
    return '100%';
  } else if (viewMode.value === 'split') {
    return `${editorWidth.value}%`;
  } else {
    return '0%';
  }
};

const getPreviewWidth = (): string => {
  if (viewMode.value === 'preview') {
    return '100%';
  } else if (viewMode.value === 'split') {
    return `${100 - editorWidth.value}%`;
  } else {
    return '0%';
  }
};

let editorScroller: HTMLElement | null = null;

const handleEditorScroll = (): void => {
  const previewEl = previewPaneRef.value?.getPreviewElement();
  if (isSyncingScroll.value || !editorScroller || !previewEl) {
    return;
  }
  isSyncingScroll.value = true;

  const editorScrollRatio =
    editorScroller.scrollTop / (editorScroller.scrollHeight - editorScroller.clientHeight);
  previewEl.scrollTop = editorScrollRatio * (previewEl.scrollHeight - previewEl.clientHeight);

  requestAnimationFrame(() => {
    isSyncingScroll.value = false;
  });
};

const handlePreviewScroll = (): void => {
  const previewEl = previewPaneRef.value?.getPreviewElement();
  if (isSyncingScroll.value || !editorScroller || !previewEl) return;
  isSyncingScroll.value = true;

  const previewScrollRatio =
    previewEl.scrollTop / (previewEl.scrollHeight - previewEl.clientHeight);
  editorScroller.scrollTop =
    previewScrollRatio * (editorScroller.scrollHeight - editorScroller.clientHeight);

  requestAnimationFrame(() => {
    isSyncingScroll.value = false;
  });
};

const setupScrollListeners = (): void => {
  if (viewMode.value !== 'split') return;

  const previewEl = previewPaneRef.value?.getPreviewElement();
  editorScroller = editorPaneRef.value?.getEditorScroller() ?? null;
  if (editorScroller && previewEl) {
    editorScroller.addEventListener('scroll', handleEditorScroll);
    previewEl.addEventListener('scroll', handlePreviewScroll);
  }
};

const removeScrollListeners = (): void => {
  const previewEl = previewPaneRef.value?.getPreviewElement();
  if (editorScroller) {
    editorScroller.removeEventListener('scroll', handleEditorScroll);
  }
  if (previewEl) {
    previewEl.removeEventListener('scroll', handlePreviewScroll);
  }
};

watch(viewMode, (newMode) => {
  removeScrollListeners();
  if (newMode === 'split') {
    setupScrollListeners();
  }
});

watch(activeIndex, () => {
  removeScrollListeners();
  if (viewMode.value === 'split') {
    setupScrollListeners();
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
  setupScrollListeners();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
  removeScrollListeners();
});
</script>

<template>
  <div class="markdown-editor-container">
    <div class="editor-header">
      {{ filePath }}
    </div>
    <div class="editor-content-split">
      <div v-if="viewMode !== 'preview'" class="editor-pane" :style="{ width: getEditorWidth() }">
        <EditorPane ref="editorPaneRef" />
      </div>
      <div v-if="viewMode === 'split'" class="resizer" @mousedown="startResize"></div>
      <div v-if="viewMode !== 'editor'" class="preview-pane" :style="{ width: getPreviewWidth() }">
        <PreviewPane ref="previewPaneRef" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.markdown-editor-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resizer {
  width: 4px;
  background-color: var(--gray);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.resizer:hover {
  background-color: var(--main-dark);
}

.editor-content-split {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-pane {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}

.editor-header {
  font-size: 12px;
  border-bottom: solid 1px var(--gray);
}

.preview-pane {
  display: flex;
  flex-direction: column;
  min-width: 200px;
}
</style>

<style>
.cm-editor {
  font-family: 'Migu 1M', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}
</style>
