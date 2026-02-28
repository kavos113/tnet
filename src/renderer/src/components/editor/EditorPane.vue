<script setup lang="ts">
import { CodeMirrorInstance, createCodeMirrorEditor } from '@renderer/scripts/codeMirrorUtils';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const store = useEditorStore();
const { activeIndex, localContent } = storeToRefs(store);

const workspaceStore = useWorkspaceStore();
const { rootPath, settings } = storeToRefs(workspaceStore);

const editorContainer = ref<HTMLElement>();
const codeMirrorInstance = ref<CodeMirrorInstance>();

const editorStyle = computed(() => ({
  fontFamily: settings.value.editorFontFamily,
  fontSize: `${settings.value.editorFontSize}px`
}));

const handleCodeMirrorChange = (content: string): void => {
  store.updateLocalContent(content);
};

const handleContentChange = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement;
  store.updateLocalContent(target.value);
};

watch(
  activeIndex,
  () => {
    if (codeMirrorInstance.value) {
      codeMirrorInstance.value.updateContent(localContent.value);
    }
  },
  { immediate: true }
);

watch(
  settings,
  (newSettings) => {
    if (codeMirrorInstance.value) {
      codeMirrorInstance.value.setEditorStyle({
        fontFamily: newSettings.editorFontFamily,
        fontSize: `${newSettings.editorFontSize}px`
      });
    }
  },
  { deep: true }
);

const getEditorScroller = (): HTMLElement | null => {
  return editorContainer.value?.querySelector('.cm-scroller') as HTMLElement | null;
};

const updateContent = (content: string): void => {
  if (codeMirrorInstance.value) {
    codeMirrorInstance.value.updateContent(content);
  }
};

onMounted(async () => {
  await nextTick();
  if (editorContainer.value) {
    codeMirrorInstance.value = createCodeMirrorEditor(
      editorContainer.value,
      localContent.value,
      handleCodeMirrorChange,
      false,
      rootPath.value
    );
  }
});

onUnmounted(() => {
  if (codeMirrorInstance.value) {
    codeMirrorInstance.value.destroy();
  }
});

defineExpose({
  getEditorScroller,
  updateContent
});
</script>

<template>
  <div class="editor-pane-root">
    <div ref="editorContainer" class="codemirror-container" :style="editorStyle"></div>
    <textarea
      v-model="localContent"
      class="markdown-editor hidden"
      :style="editorStyle"
      @input="handleContentChange"
    ></textarea>
  </div>
</template>

<style scoped>
.editor-pane-root {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.codemirror-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.markdown-editor {
  flex: 1;
  padding: 12px;
  border: none;
  outline: none;
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: 'Migu 1M', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
  resize: none;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.hidden {
  display: none;
}
</style>
