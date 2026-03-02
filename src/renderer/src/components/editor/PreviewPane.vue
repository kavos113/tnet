<script setup lang="ts">
/* eslint-disable vue/no-v-html */
import { markdownService } from '@renderer/services/markdownService';
import { useEditorStore } from '@renderer/store/editor';
import { useWorkspaceStore } from '@renderer/store/workspace';
import { storeToRefs } from 'pinia';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import '../../assets/katex.css';
import 'highlight.js/styles/github.css';

const store = useEditorStore();
const { htmlPreview } = storeToRefs(store);

const workspaceStore = useWorkspaceStore();
const { settings } = storeToRefs(workspaceStore);

const previewContainer = ref<HTMLElement>();

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

const previewStyle = computed(() => ({
  fontFamily: settings.value.previewFontFamily,
  fontSize: `${settings.value.previewFontSize}px`
}));

const handleInternalLinkClick = (event: MouseEvent): void => {
  const target = event.target as HTMLElement;
  const link = target.closest('a[data-internal-link="true"]');

  if (link) {
    event.preventDefault();
    const path = link.getAttribute('data-path');

    if (path) {
      internalLinkTooltip.value.visible = false;
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

  const htmlContent = await markdownService.parse(content);

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

const getPreviewElement = (): HTMLElement | undefined => {
  return previewContainer.value;
};

onMounted(() => {
  setupLinkListener();
});

onUnmounted(() => {
  removeLinkListener();
  hideInternalLinkTooltip();
});

defineExpose({
  getPreviewElement
});
</script>

<template>
  <div class="preview-pane-root">
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
</template>

<style scoped>
.preview-pane-root {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

.internal-link-tooltip {
  position: absolute;
  z-index: 50;
  overflow: auto;
  padding: 8px 10px;
  background-color: var(--background);
  color: var(--foreground);
  pointer-events: none;
  border: 2px solid var(--main-light);
  border-radius: 5px;
  box-shadow: 0 8px 10px rgba(0, 0, 0, 0.1);
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
  min-width: 0;
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

.markdown-preview :deep(.keyword-emphasized),
.internal-link-tooltip :deep(.keyword-emphasized) {
  margin: 20px 0;
  padding: 0.5em 1.5em;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.5);
  background-color: var(--background);
}

.markdown-preview :deep(.keyword-normal),
.internal-link-tooltip :deep(.keyword-normal) {
  margin: 20px 0;
  padding: 0.5em 1.5em;
  border-left: 2px solid var(--main-light);
}

.markdown-preview :deep(.keyword-title),
.internal-link-tooltip :deep(.keyword-title) {
  font-weight: bold;
  margin: 0;
  padding: 5px 5px 0 5px;
  font-size: 1.5em;
  border-bottom: 2px solid var(--main-dark);
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

.markdown-preview :deep(.katex),
.internal-link-tooltip :deep(.katex) {
  margin-left: 2px;
  margin-right: 2px;
}
</style>
