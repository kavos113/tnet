import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type RefObject,
  type ReactNode
} from 'react';
import type { PluggableList } from 'unified';
import { markdownService } from './markdown/markdownService';
import { extractPreviewOutline, PreviewOutline, type PreviewOutlineItem } from './PreviewOutline';
import type { ObsidianImageSrcResolver } from './markdown/obsidianImages';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';
import styles from './MarkdownPreviewPane.module.css';

export interface MarkdownPreviewPaneProps {
  markdown: string;
  showOutline?: boolean;
  onToggleTask?: (sourceLine: number, checked: boolean) => void;
  resolveImageSrc?: ObsidianImageSrcResolver;
  onRendered?: () => void;
  renderDebounceMs?: number;
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  overlays?: (containerRef: RefObject<HTMLDivElement | null>) => ReactNode;
}

export interface MarkdownPreviewPaneHandle {
  getPreviewElement: () => HTMLElement | null;
}

const areOutlineItemsEqual = (
  current: PreviewOutlineItem[],
  next: PreviewOutlineItem[]
): boolean => {
  if (current.length !== next.length) return false;
  return current.every(
    (item, index) =>
      item.id === next[index].id &&
      item.level === next[index].level &&
      item.text === next[index].text
  );
};

export const MarkdownPreviewPane = forwardRef<MarkdownPreviewPaneHandle, MarkdownPreviewPaneProps>(
  (
    {
      markdown,
      showOutline = false,
      onToggleTask,
      resolveImageSrc,
      onRendered,
      renderDebounceMs = 80,
      remarkPlugins,
      rehypePlugins,
      overlays
    },
    ref
  ): React.JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [html, setHtml] = useState('');
    const [outlineItems, setOutlineItems] = useState<PreviewOutlineItem[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        getPreviewElement: () => containerRef.current
      }),
      []
    );

    useEffect(() => {
      let canceled = false;
      const timeoutId = window.setTimeout(() => {
        const startedAt = performance.now();

        markdownService
          .parsePreviewMarkdown(markdown, {
            resolveImageSrc,
            remarkPlugins,
            rehypePlugins
          })
          .then((nextHtml) => {
            if (import.meta.env.DEV) {
              console.debug(
                'Preview Markdown parse',
                Math.round(performance.now() - startedAt),
                'ms'
              );
            }
            if (!canceled) setHtml(nextHtml);
          })
          .catch((error: unknown) => {
            console.error('Failed to render markdown', error);
            if (!canceled) setHtml('<p>Failed to render markdown.</p>');
          });
      }, renderDebounceMs);

      return () => {
        canceled = true;
        window.clearTimeout(timeoutId);
      };
    }, [markdown, rehypePlugins, remarkPlugins, renderDebounceMs, resolveImageSrc]);

    useEffect(() => {
      if (!containerRef.current) return;
      const startedAt = performance.now();
      const nextOutlineItems = extractPreviewOutline(containerRef.current);
      if (import.meta.env.DEV) {
        console.debug('Preview outline extract', Math.round(performance.now() - startedAt), 'ms');
      }
      setOutlineItems((current) =>
        areOutlineItemsEqual(current, nextOutlineItems) ? current : nextOutlineItems
      );
      if (containerRef.current.querySelector('.mermaid')) {
        markdownService.renderMermaid(containerRef.current).catch((error: unknown) => {
          console.error('Failed to render Mermaid diagrams', error);
        });
      }
      onRendered?.();
    }, [html, onRendered]);

    const scrollToHeading = useCallback((id: string): void => {
      const container = containerRef.current;
      if (!container) return;

      const target = Array.from(container.querySelectorAll<HTMLElement>('[id]')).find(
        (element) => element.id === id
      );
      target?.scrollIntoView({ block: 'start' });
    }, []);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const handleTaskToggle = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (target.type !== 'checkbox') return;

        const taskItem = target.closest<HTMLElement>('li[data-source-line]');
        const sourceLine = Number(taskItem?.dataset.sourceLine);
        if (!Number.isFinite(sourceLine) || sourceLine < 1) return;

        onToggleTask?.(sourceLine, target.checked);
      };

      container.addEventListener('change', handleTaskToggle);
      return () => {
        container.removeEventListener('change', handleTaskToggle);
      };
    }, [html, onToggleTask]);

    return (
      <div className={styles.root}>
        <div
          ref={containerRef}
          className="markdown-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {showOutline ? <PreviewOutline items={outlineItems} onSelect={scrollToHeading} /> : null}
        {overlays?.(containerRef)}
      </div>
    );
  }
);

MarkdownPreviewPane.displayName = 'MarkdownPreviewPane';
