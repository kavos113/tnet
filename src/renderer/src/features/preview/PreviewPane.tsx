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
  loadKeywordContent: (filePath: string, name: string) => Promise<string | null>;
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
  ({ markdown, showOutline, onOpenInternalLink, loadKeywordContent }, ref): React.JSX.Element => {
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

      markdownService
        .parsePreviewMarkdown(markdown)
        .then((nextHtml) => {
          if (!canceled) setHtml(nextHtml);
        })
        .catch((error: unknown) => {
          console.error('Failed to render markdown', error);
          if (!canceled) setHtml('<p>Failed to render markdown.</p>');
        });

      return () => {
        canceled = true;
      };
    }, [markdown]);

    useEffect(() => {
      if (!containerRef.current) return;
      const nextOutlineItems = extractPreviewOutline(containerRef.current);
      setOutlineItems((current) =>
        areOutlineItemsEqual(current, nextOutlineItems) ? current : nextOutlineItems
      );
      markdownService.renderMermaid(containerRef.current).catch((error: unknown) => {
        console.error('Failed to render Mermaid diagrams', error);
      });
    }, [html]);

    const scrollToHeading = useCallback((id: string): void => {
      const container = containerRef.current;
      if (!container) return;

      const target = Array.from(container.querySelectorAll<HTMLElement>('[id]')).find(
        (element) => element.id === id
      );
      target?.scrollIntoView({ block: 'start' });
    }, []);

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
