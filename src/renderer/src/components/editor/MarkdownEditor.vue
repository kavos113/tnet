<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { CodeMirrorInstance, createCodeMirrorEditor } from '@renderer/scripts/codeMirrorUtils';
import { markdownToHtml, renderMermaid } from '@renderer/scripts/markdownUtils';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import '../../assets/katex.css';
import 'highlight.js/styles/github.css';

const store = useEditorStore();
const { openedFiles, activeIndex, viewMode } = storeToRefs(store);

const workspaceStore = useWorkspaceStore();
const { rootPath, settings } = storeToRefs(workspaceStore);

const editorContainer = ref<HTMLElement>();
const previewContainer = ref<HTMLElement>();
const codeMirrorInstance = ref<CodeMirrorInstance>();
const isSaving = ref<boolean>(false);
const localContent = ref<string>('');
const htmlPreview = ref<string>('');
const filePath = ref<string>('');

const internalLinkTooltip = ref<{
  visible: boolean;
  x: number;
  y: number;
  content: string;
}>({
  visible: false,
  x: 0,
  y: 0,
  content: ''
});

const internalLinkTooltipCache = new Map<string, string | null>();

const isResizing = ref<boolean>(false);
const editorWidth = ref<number>(50); // percent

const isSyncingScroll = ref<boolean>(false);

const editorStyle = computed(() => ({
  fontFamily: settings.value.editorFontFamily,
  fontSize: `${settings.value.editorFontSize}px`
}));

const previewStyle = computed(() => ({
  fontFamily: settings.value.previewFontFamily,
  fontSize: `${settings.value.previewFontSize}px`
}));

watch(
  activeIndex,
  (newIndex) => {
    if (newIndex < 0 || newIndex >= openedFiles.value.length) {
      return;
    }

    localContent.value = openedFiles.value[newIndex].content;
    filePath.value = openedFiles.value[newIndex].path;
    if (codeMirrorInstance.value) {
      codeMirrorInstance.value.updateContent(localContent.value);
    }
  },
  { immediate: true }
);

const handleInternalLinkClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  const link = target.closest('a[data-internal-link="true"]');

  if (link) {
    event.preventDefault();
    const path = link.getAttribute('data-path');

    if (path) {
      store.open(path);
    }
  }
};

const normalizeTooltipContent = (raw: string): string => {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  const collapsed = normalized.replace(/\n{3,}/g, '\n\n');
  const maxLen = 800;
  if (collapsed.length <= maxLen) return collapsed;
  return collapsed.slice(0, maxLen) + '…';
};

const showInternalLinkTooltip = async (event: MouseEvent, content: string): Promise<void> => {
  if (!previewContainer.value) return;

  const htmlContent = await markdownToHtml(content);

  const rect = previewContainer.value.getBoundingClientRect();
  internalLinkTooltip.value = {
    visible: true,
    x: Math.max(8, event.clientX - rect.left + 12),
    y: Math.max(8, event.clientY - rect.top + 12),
    content: htmlContent
  };
};

const hideInternalLinkTooltip = (): void => {
  internalLinkTooltip.value.visible = false;
};

const handleInternalLinkHover = async (event: MouseEvent): Promise<void> => {
  const target = event.target as HTMLElement;
  const link = target.closest('a[data-internal-link="true"]') as HTMLAnchorElement | null;
  if (!link) return;

  const path = link.getAttribute('data-path') || '';
  const name = (link.textContent || '').trim();
  if (!path || !name) return;

  const cacheKey = `${path}::${name}`;
  link.dataset.keywordHoverKey = cacheKey;
  showInternalLinkTooltip(event, '読み込み中…');

  if (internalLinkTooltipCache.has(cacheKey)) {
    const cached = internalLinkTooltipCache.get(cacheKey);
    if (cached) {
      showInternalLinkTooltip(event, cached);
    } else {
      showInternalLinkTooltip(event, 'キーワードが見つかりません');
    }
    return;
  }

  try {
    const content = await window.electronAPI.getKeywordContent(path, name);
    if (link.dataset.keywordHoverKey !== cacheKey) return;

    const tooltip = content ? normalizeTooltipContent(content) : null;
    internalLinkTooltipCache.set(cacheKey, tooltip);
    if (tooltip) {
      showInternalLinkTooltip(event, tooltip);
    } else {
      showInternalLinkTooltip(event, 'キーワードが見つかりません');
    }
  } catch (err) {
    console.error('error getting keyword content', err);
    internalLinkTooltipCache.set(cacheKey, null);
    showInternalLinkTooltip(event, 'キーワードが見つかりません');
  }
};

const handleInternalLinkOut = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  const link = target.closest('a[data-internal-link="true"]') as HTMLAnchorElement | null;
  if (!link) return;

  const related = event.relatedTarget as HTMLElement | null;
  if (related && link.contains(related)) return;

  hideInternalLinkTooltip();
};

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

    if (activeIndex.value >= 0 && activeIndex.value < openedFiles.value.length) {
      const file = store.openedFiles[activeIndex.value];
      if (file.content !== newContent) {
        file.content = newContent;
        file.isModified = true;
      }
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
    localContent.value = await window.electronAPI.readFile(
      openedFiles.value[activeIndex.value].path
    );
    if (codeMirrorInstance.value) {
      codeMirrorInstance.value.updateContent(localContent.value);
    }
    store.openedFiles[activeIndex.value].content = localContent.value;
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
  if (isSyncingScroll.value || !editorScroller || !previewContainer.value) {
    return;
  }
  isSyncingScroll.value = true;

  const editorScrollRatio =
    editorScroller.scrollTop / (editorScroller.scrollHeight - editorScroller.clientHeight);
  previewContainer.value.scrollTop =
    editorScrollRatio * (previewContainer.value.scrollHeight - previewContainer.value.clientHeight);

  requestAnimationFrame(() => {
    isSyncingScroll.value = false;
  });
};

const handlePreviewScroll = (): void => {
  if (isSyncingScroll.value || !editorScroller || !previewContainer.value) return;
  isSyncingScroll.value = true;

  const previewScrollRatio =
    previewContainer.value.scrollTop /
    (previewContainer.value.scrollHeight - previewContainer.value.clientHeight);
  editorScroller.scrollTop =
    previewScrollRatio * (editorScroller.scrollHeight - editorScroller.clientHeight);

  requestAnimationFrame(() => {
    isSyncingScroll.value = false;
  });
};

const setupScrollListeners = (): void => {
  if (viewMode.value !== 'split') return;

  nextTick(() => {
    if (codeMirrorInstance.value && previewContainer.value) {
      editorScroller = editorContainer.value?.querySelector('.cm-scroller') as HTMLElement;
      if (editorScroller) {
        editorScroller.addEventListener('scroll', handleEditorScroll);
        previewContainer.value.addEventListener('scroll', handlePreviewScroll);
      }
    }
  });
};

const removeScrollListeners = (): void => {
  if (editorScroller) {
    editorScroller.removeEventListener('scroll', handleEditorScroll);
  }
  if (previewContainer.value) {
    previewContainer.value.removeEventListener('scroll', handlePreviewScroll);
  }
};

const setupLinkListener = (): void => {
  if (previewContainer.value) {
    previewContainer.value.addEventListener('click', handleInternalLinkClick);
    previewContainer.value.addEventListener('mouseover', handleInternalLinkHover);
    previewContainer.value.addEventListener('mouseout', handleInternalLinkOut);
  }
};

const removeLinkListener = (): void => {
  if (previewContainer.value) {
    previewContainer.value.removeEventListener('click', handleInternalLinkClick);
    previewContainer.value.removeEventListener('mouseover', handleInternalLinkHover);
    previewContainer.value.removeEventListener('mouseout', handleInternalLinkOut);
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

onMounted(async () => {
  document.addEventListener('keydown', handleKeyDown);

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
  setupLinkListener();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);

  if (codeMirrorInstance.value) {
    codeMirrorInstance.value.destroy();
  }
  removeLinkListener();
  hideInternalLinkTooltip();
});
</script>

<template>
  <div class="markdown-editor-container">
    <div class="editor-header">
      {{ filePath }}
    </div>
    <div class="editor-content-split">
      <div v-if="viewMode !== 'preview'" class="editor-pane" :style="{ width: getEditorWidth() }">
        <div ref="editorContainer" class="codemirror-container" :style="editorStyle"></div>
        <textarea
          v-model="localContent"
          class="markdown-editor hidden"
          :style="editorStyle"
          @input="handleContentChange"
        ></textarea>
      </div>
      <div v-if="viewMode === 'split'" class="resizer" @mousedown="startResize"></div>
      <div v-if="viewMode !== 'editor'" class="preview-pane" :style="{ width: getPreviewWidth() }">
        <div
          ref="previewContainer"
          class="markdown-preview"
          :style="previewStyle"
          v-html="htmlPreview"
        ></div>
        <div
          v-if="internalLinkTooltip.visible"
          class="internal-link-tooltip"
          :style="{
            left: internalLinkTooltip.x + 'px',
            top: internalLinkTooltip.y + 'px',
            ...previewStyle
          }"
          v-html="internalLinkTooltip.content"
        ></div>
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

.preview-pane {
  position: relative;
}

.internal-link-tooltip {
  position: absolute;
  z-index: 50;
  overflow: auto;
  padding: 8px 10px;
  border: 1px solid var(--gray);
  background-color: var(--background);
  color: var(--foreground);
  pointer-events: none;
  border: 2px solid var(--main-light);
  border-radius: 5px;
  box-shadow: 0 8px 10px rgba(0, 0, 0, 0.1);
}

.resizer {
  width: 4px;
  background-color: var(--gray);
  cursor: col-resize;
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.resizer hover {
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

.codemirror-container {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

.hidden {
  display: none;
}

.markdown-preview {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  background-color: var(--bg-color);
  font-family:
    'Rounded Mplus 1c',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-color);
}

.markdown-preview :deep(h1),
.internal-link-tooltip :deep(h1) {
  font-size: 2em;
  font-weight: bold;
  margin: 0.67em 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h2),
.internal-link-tooltip :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin: 0.83em 0;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h3),
.internal-link-tooltip :deep(h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin: 1em 0;
}

.markdown-preview :deep(h4),
.internal-link-tooltip :deep(h4) {
  font-size: 1em;
  font-weight: bold;
  margin: 1.33em 0;
}

.markdown-preview :deep(h5),
.internal-link-tooltip :deep(h5) {
  font-size: 0.83em;
  margin: 1.67em 0;
}

.markdown-preview :deep(h6),
.internal-link-tooltip :deep(h6) {
  font-size: 0.67em;
  margin: 2.33em 0;
}

.markdown-preview :deep(p),
.internal-link-tooltip :deep(p) {
  margin: 1em 0;
}

.markdown-preview :deep(blockquote),
.internal-link-tooltip :deep(blockquote) {
  margin: 1em 0;
  padding-left: 1em;
  border-left: 4px solid var(--accent-color);
  background-color: var(--sidebar-bg);
  color: #666;
}

.markdown-preview :deep(ul),
.internal-link-tooltip :deep(ul),
.markdown-preview :deep(ol),
.internal-link-tooltip :deep(ol) {
  margin: 1em 0;
  padding-left: 2em;
}

.markdown-preview :deep(ul),
.internal-link-tooltip :deep(ul) {
  list-style-type: disc;
}

.markdown-preview :deep(ol),
.internal-link-tooltip :deep(ol) {
  list-style-type: decimal;
}

.markdown-preview :deep(code),
.internal-link-tooltip :deep(code) {
  background-color: var(--sidebar-bg);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre),
.internal-link-tooltip :deep(pre) {
  background-color: var(--sidebar-bg);
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-preview :deep(pre code),
.internal-link-tooltip :deep(pre code) {
  background-color: transparent;
  padding: 0;
  border-radius: 0;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(table),
.internal-link-tooltip :deep(table) {
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-preview :deep(th),
.internal-link-tooltip :deep(th),
.markdown-preview :deep(td),
.internal-link-tooltip :deep(td) {
  border: 1px solid var(--border-color);
  padding: 0.5em;
  text-align: left;
}

.markdown-preview :deep(th),
.internal-link-tooltip :deep(th) {
  background-color: var(--sidebar-header-bg);
  font-weight: bold;
}

.markdown-preview :deep(strong),
.internal-link-tooltip :deep(strong) {
  font-weight: bold;
}

.markdown-preview :deep(.mermaid),
.internal-link-tooltip :deep(.mermaid) {
  background-color: var(--bg-color);
  padding: 1em;
  border-radius: 5px;
  margin: 1em 0;
  text-align: center;
}

.markdown-preview :deep(.card-link-container),
.internal-link-tooltip :deep(.card-link-container) {
  width: 100%;
}

.markdown-preview :deep(.card-link),
.internal-link-tooltip :deep(.card-link) {
  display: flex;
  background-color: #ffffff;
  border: 1px solid #b1b8bd;
  border-radius: 8px;
  overflow: hidden;
  text-decoration: none;
  color: #14171a;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
}

.markdown-preview :deep(.card-link:hover),
.internal-link-tooltip :deep(.card-link:hover) {
  background-color: #f0f0f0;
}

.markdown-preview :deep(.card-content),
.internal-link-tooltip :deep(.card-content) {
  flex: 1;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; /* Flexboxでのテキストオーバーフロー問題を防止 */
}

.markdown-preview :deep(.card-title),
.internal-link-tooltip :deep(.card-title) {
  font-weight: 600;
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.markdown-preview :deep(.card-description),
.internal-link-tooltip :deep(.card-description) {
  color: #657786;
  margin: 0 0 12px;
  flex-grow: 1;
  /* 説明文を2行に制限して、...で省略 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.markdown-preview :deep(.card-footer),
.internal-link-tooltip :deep(.card-footer) {
  display: flex;
  align-items: center;
  color: #657786;
}

.markdown-preview :deep(.card-favicon),
.internal-link-tooltip :deep(.card-favicon) {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  flex-shrink: 0;
}

.markdown-preview :deep(.card-url),
.internal-link-tooltip :deep(.card-url) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.markdown-preview :deep(.card-thumbnail),
.internal-link-tooltip :deep(.card-thumbnail) {
  width: 130px;
  flex-shrink: 0;
  background-color: #f5f8fa;
}

.markdown-preview :deep(.card-thumbnail),
.internal-link-tooltip :deep(.card-thumbnail) img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-left: 1px solid #e1e8ed;
}

.markdown-preview :deep(.keyword),
.internal-link-tooltip :deep(.keyword) {
  margin-top: 10px;
  padding: 0.5em;
  border: 3px solid var(--main-dark);
  border-radius: 5px;
  box-shadow: 0 8px 10px rgba(0, 0, 0, 0.1);
  background-color: var(--background);
}

.markdown-preview :deep(.keyword-title),
.internal-link-tooltip :deep(.keyword-title) {
  font-weight: bold;
  margin: 0;
  padding: 5px 5px 0 5px;
  font-size: 1.5em;
  border-bottom: 2px solid var(--color-text);
}

.markdown-preview :deep(.keyword-content),
.internal-link-tooltip :deep(.keyword-content) p,
.markdown-preview :deep(.keyword-content),
.internal-link-tooltip :deep(.keyword-content) ul,
.markdown-preview :deep(.keyword-content),
.internal-link-tooltip :deep(.keyword-content) ol {
  margin: 0;
}

.markdown-preview :deep(.keyword-content),
.internal-link-tooltip :deep(.keyword-content) h3 {
  margin-bottom: 5px;
}

.markdown-preview :deep(.cm-codeblock),
.internal-link-tooltip :deep(.cm-codeblock) {
  background-color: #2c313a;
  border-radius: 4px;
  padding: 10px;
  font-family: 'Fira Code', 'Courier New', monospace;
}
</style>

<style>
.cm-editor {
  font-family: 'Migu 1M', 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
}
</style>
