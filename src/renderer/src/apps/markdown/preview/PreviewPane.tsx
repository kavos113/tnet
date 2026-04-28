import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { InternalLinkTooltipController } from './InternalLinkTooltip';
import { markdownService } from './markdown/markdownService';
import { extractPreviewOutline, PreviewOutline, type PreviewOutlineItem } from './PreviewOutline';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  markdown: string;
  showOutline: boolean;
  onOpenInternalLink: (filePath: string) => Promise<void> | void;
  onToggleTask?: (sourceLine: number, checked: boolean) => void;
  loadKeywordContent: (filePath: string, name: string) => Promise<string | null>;
  loadImageDataUrl: (filename: string) => Promise<string | null>;
  onRendered?: () => void;
  renderDebounceMs?: number;
}

export interface PreviewPaneHandle {
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

export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
  (
    {
      markdown,
      showOutline,
      onOpenInternalLink,
      onToggleTask,
      loadKeywordContent,
      loadImageDataUrl,
      onRendered,
      renderDebounceMs = 80
    },
    ref
  ): React.JSX.Element => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [html, setHtml] = useState('');
    const [outlineItems, setOutlineItems] = useState<PreviewOutlineItem[]>([]);

    const openInternalLink = useCallback(
      (filePath: string): void => {
        Promise.resolve(onOpenInternalLink(filePath)).catch((error: unknown) => {
          console.error('Failed to open internal link', error);
        });
      },
      [onOpenInternalLink]
    );

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
          .parsePreviewMarkdown(markdown, { resolveImageSrc: loadImageDataUrl })
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
    }, [loadImageDataUrl, markdown, renderDebounceMs]);

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
      <div className="preview-pane-root">
        <div
          ref={containerRef}
          className="markdown-preview"
          // The preview renders local workspace Markdown. The pipeline intentionally supports raw HTML,
          // matching the legacy editor behavior.
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {showOutline ? <PreviewOutline items={outlineItems} onSelect={scrollToHeading} /> : null}
        <InternalLinkTooltipController
          containerRef={containerRef}
          onOpenInternalLink={openInternalLink}
          loadKeywordContent={loadKeywordContent}
        />
      </div>
    );
  }
);

PreviewPane.displayName = 'PreviewPane';
