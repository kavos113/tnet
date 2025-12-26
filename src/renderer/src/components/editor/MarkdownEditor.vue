<script setup lang="ts">
import { CodeMirrorInstance, createCodeMirrorEditor } from '@renderer/scripts/codeMirrorUtils';
import { markdownToHtml, renderMermaid } from '@renderer/scripts/markdownUtils';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';

const store = useEditorStore();
const { openedFiles, activeIndex, viewMode } = storeToRefs(store);

const workspaceStore = useWorkspaceStore();
const { rootPath } = storeToRefs(workspaceStore);

const editorContainer = ref<HTMLElement>();
const previewContainer = ref<HTMLElement>();
const codeMirrorInstance = ref<CodeMirrorInstance>();
const isSaving = ref<boolean>(false);
const localContent = ref<string>('');
const htmlPreview = ref<string>('');
const filePath = ref<string>('');

watch(
  () => activeIndex,
  (newIndex) => {
    if (newIndex.value < 0 || newIndex.value >= openedFiles.value.length) {
      return;
    }

    localContent.value = openedFiles.value[newIndex.value].content;
    filePath.value = openedFiles.value[newIndex.value].path;
    if (codeMirrorInstance.value) {
      codeMirrorInstance.value.updateContent(localContent.value);
    }
  },
  { immediate: true }
);

const handleContentChange = (event: Event): void => {
  const target = event.target as HTMLTextAreaElement;
  localContent.value = target.value;
};

const handleCodeMirrorChange = (content: string): void => {
  localContent.value = content;
};

watch(
  localContent,
  async (newContent) => {
    if (newContent === null || newContent === undefined) {
      htmlPreview.value = '';
      return;
    }

    try {
      htmlPreview.value = await markdownToHtml(newContent);
      await nextTick();
      renderMermaid();
    } catch (err) {
      console.error('error rendering markdown', err);
      htmlPreview.value = '<p>error rendering markdown</p>';
    }
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
  } catch (err) {
    console.error('error saving file', err);
  } finally {
    isSaving.value = false;
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
</script>

<template>
  <div class="markdown-editor-container">
    <div class="editor-header">
      {{ filePath }}
    </div>
    <div class="editor-content-split">
      <div class="editor-pane">
        <div ref="editorContainer" class="codemirror-container"></div>
        <textarea
          v-model="localContent"
          class="markdown-editor hidden"
          @input="handleContentChange"
        ></textarea>
      </div>
      <div class="preview-pane">
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div ref="previewContainer" class="markdown-preview" v-html="htmlPreview"></div>
      </div>
    </div>
  </div>
</template>
