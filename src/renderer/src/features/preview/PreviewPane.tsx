import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { openFile } from '@renderer/features/editor/editorSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { useAppDispatch } from '@renderer/app/hooks';
import { markdownService } from './markdown/markdownService';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  markdown: string;
}

export interface PreviewPaneHandle {
  getPreviewElement: () => HTMLElement | null;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  html: string;
}

const emptyTooltip: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  html: ''
};

const normalizeTooltipContent = (content: string): string => {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length <= 800) return normalized;
  return `${normalized.slice(0, 800)}...`;
};

const missingKeywordMessage = 'Keyword not found.';

const closestInternalLink = (target: EventTarget | null): HTMLAnchorElement | null => {
  const element =
    target instanceof HTMLElement ? target : target instanceof Text ? target.parentElement : null;
  return element?.closest<HTMLAnchorElement>('a[data-internal-link="true"]') ?? null;
};

export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
  ({ markdown }, ref): React.JSX.Element => {
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const activeTooltipKeyRef = useRef<string | null>(null);
    const tooltipCacheRef = useRef<Map<string, string | null>>(new Map());
    const [html, setHtml] = useState('');
    const [tooltip, setTooltip] = useState<TooltipState>(emptyTooltip);

    const hideTooltip = (link?: HTMLAnchorElement): void => {
      if (link) delete link.dataset.keywordHoverKey;
      activeTooltipKeyRef.current = null;
      flushSync(() => setTooltip(emptyTooltip));
    };

    const openInternalLink = (filePath: string): void => {
      tnetApi.file
        .read(filePath)
        .then((content) => {
          dispatch(openFile({ path: filePath, content }));
        })
        .catch((error: unknown) => {
          console.error('Failed to open internal link', error);
        });
    };

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
        .parse(markdown)
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
      markdownService.renderMermaid(containerRef.current).catch((error: unknown) => {
        console.error('Failed to render Mermaid diagrams', error);
      });
    }, [html]);

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const renderTooltip = async (
        event: MouseEvent,
        content: string,
        expectedKey: string
      ): Promise<void> => {
        const rect = container.getBoundingClientRect();
        const tooltipHtml = await markdownService.parse(content);
        if (activeTooltipKeyRef.current !== expectedKey) return;

        setTooltip({
          visible: true,
          x: Math.max(8, event.clientX - rect.left + 12),
          y: Math.max(8, event.clientY - rect.top + 12),
          html: tooltipHtml
        });
      };

      const onMouseOver = (event: MouseEvent): void => {
        const link = closestInternalLink(event.target);
        if (!link) return;

        const related = event.relatedTarget;
        if (related instanceof Node && link.contains(related)) return;

        const filePath = link.getAttribute('data-path');
        const name = link.textContent?.trim();
        if (!filePath || !name) return;

        const cacheKey = `${filePath}::${name}`;
        if (activeTooltipKeyRef.current === cacheKey) return;

        activeTooltipKeyRef.current = cacheKey;
        link.dataset.keywordHoverKey = cacheKey;

        const cached = tooltipCacheRef.current.get(cacheKey);
        if (cached !== undefined) {
          renderTooltip(
            event,
            cached ? normalizeTooltipContent(cached) : missingKeywordMessage,
            cacheKey
          ).catch((error: unknown) => {
            console.error('Failed to render keyword tooltip', error);
          });
          return;
        }

        renderTooltip(event, 'Loading...', cacheKey).catch((error: unknown) => {
          console.error('Failed to render keyword tooltip', error);
        });

        tnetApi.keyword
          .getContent(filePath, name)
          .then((content) => {
            tooltipCacheRef.current.set(cacheKey, content);
            if (link.dataset.keywordHoverKey !== cacheKey) return;

            return renderTooltip(
              event,
              content ? normalizeTooltipContent(content) : missingKeywordMessage,
              cacheKey
            );
          })
          .catch((error: unknown) => {
            tooltipCacheRef.current.set(cacheKey, null);
            console.error('Failed to load keyword tooltip', error);
            if (link.dataset.keywordHoverKey !== cacheKey) return;
            return renderTooltip(event, missingKeywordMessage, cacheKey);
          });
      };

      const onMouseOut = (event: MouseEvent): void => {
        const link = closestInternalLink(event.target);
        if (!link) return;

        const related = event.relatedTarget;
        if (related instanceof Node && link.contains(related)) return;

        hideTooltip(link);
      };

      const onDocumentClick = (event: MouseEvent): void => {
        const link = closestInternalLink(event.target);
        if (!link || !container.contains(link)) return;

        event.preventDefault();
        hideTooltip(link);

        const filePath = link.getAttribute('data-path');
        if (filePath) openInternalLink(filePath);
      };

      container.addEventListener('mouseover', onMouseOver);
      container.addEventListener('mouseout', onMouseOut, true);
      document.addEventListener('click', onDocumentClick, true);
      return () => {
        container.removeEventListener('mouseover', onMouseOver);
        container.removeEventListener('mouseout', onMouseOut, true);
        document.removeEventListener('click', onDocumentClick, true);
      };
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
        {tooltip.visible ? (
          <div
            className="internal-link-tooltip"
            style={{ left: tooltip.x, top: tooltip.y }}
            dangerouslySetInnerHTML={{ __html: tooltip.html }}
          />
        ) : null}
      </div>
    );
  }
);

PreviewPane.displayName = 'PreviewPane';
