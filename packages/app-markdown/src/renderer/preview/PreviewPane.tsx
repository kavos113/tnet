import { forwardRef, useCallback, useMemo, type MouseEvent } from 'react';
import {
  MarkdownPreviewPane,
  type MarkdownPreviewPaneHandle
} from '@tnet/markdown-editor/renderer';
import { InternalLinkTooltipController } from './InternalLinkTooltip';
import { rehypeAiChat } from './markdown/rehypeAiChat';
import { rehypeKeyword } from './markdown/rehypeKeyword';
import { rehypePdfLinks } from './markdown/rehypePdfLinks';
import { remarkInternalLinks } from './markdown/remarkInternalLinks';
import { closestPdfLink } from './tooltip/pdfLinkTarget';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  markdown: string;
  showOutline: boolean;
  onOpenInternalLink: (filePath: string) => Promise<void> | void;
  onOpenPdfLink?: (href: string) => void;
  onToggleTask?: (sourceLine: number, checked: boolean) => void;
  loadKeywordContent: (filePath: string, name: string) => Promise<string | null>;
  loadImageDataUrl: (filename: string) => Promise<string | null>;
  onRendered?: () => void;
  renderDebounceMs?: number;
  enableBacklinks?: boolean;
}

export type PreviewPaneHandle = MarkdownPreviewPaneHandle;

export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
  (
    {
      markdown,
      showOutline,
      onOpenInternalLink,
      onOpenPdfLink,
      onToggleTask,
      loadKeywordContent,
      loadImageDataUrl,
      onRendered,
      renderDebounceMs,
      enableBacklinks = false
    },
    ref
  ): React.JSX.Element => {
    const remarkPlugins = useMemo(
      () => (enableBacklinks ? [remarkInternalLinks] : []),
      [enableBacklinks]
    );
    const rehypePlugins = useMemo(
      () => [
        ...(enableBacklinks ? [rehypePdfLinks] : []),
        rehypeAiChat(markdown),
        rehypeKeyword(markdown)
      ],
      [enableBacklinks, markdown]
    );
    const openInternalLink = useCallback(
      (filePath: string): void => {
        Promise.resolve(onOpenInternalLink(filePath)).catch((error: unknown) => {
          console.error('Failed to open internal link', error);
        });
      },
      [onOpenInternalLink]
    );
    const openPdfLink = useCallback(
      (event: MouseEvent<HTMLDivElement>): void => {
        if (!onOpenPdfLink) return;
        const link = closestPdfLink(event.target);
        if (!link) return;

        event.preventDefault();
        const href = link.getAttribute('data-pdf-target') ?? link.getAttribute('href');
        if (href) onOpenPdfLink(href);
      },
      [onOpenPdfLink]
    );

    return (
      <MarkdownPreviewPane
        ref={ref}
        markdown={markdown}
        showOutline={showOutline}
        onToggleTask={onToggleTask}
        resolveImageSrc={loadImageDataUrl}
        onPreviewClickCapture={enableBacklinks ? openPdfLink : undefined}
        onRendered={onRendered}
        renderDebounceMs={renderDebounceMs}
        remarkPlugins={remarkPlugins}
        rehypePlugins={rehypePlugins}
        overlays={
          enableBacklinks
            ? (containerRef) => (
                <>
                  <InternalLinkTooltipController
                    containerRef={containerRef}
                    onOpenInternalLink={openInternalLink}
                    loadKeywordContent={loadKeywordContent}
                  />
                </>
              )
            : undefined
        }
      />
    );
  }
);

PreviewPane.displayName = 'PreviewPane';
