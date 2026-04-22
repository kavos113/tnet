import { type RefObject, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { tnetApi } from '@renderer/lib/tnetApi';
import {
  emptyInternalLinkTooltip,
  type InternalLinkTooltipState
} from './internalLinkTooltipState';
import { markdownService } from './markdown/markdownService';

interface UseInternalLinkTooltipOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  onOpenInternalLink: (filePath: string) => void;
}

const missingKeywordMessage = 'Keyword not found.';

export const normalizeTooltipContent = (content: string): string => {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (normalized.length <= 800) return normalized;
  return `${normalized.slice(0, 800)}...`;
};

export const closestInternalLink = (target: EventTarget | null): HTMLAnchorElement | null => {
  const element =
    target instanceof HTMLElement ? target : target instanceof Text ? target.parentElement : null;
  return element?.closest<HTMLAnchorElement>('a[data-internal-link="true"]') ?? null;
};

export const useInternalLinkTooltip = ({
  containerRef,
  onOpenInternalLink
}: UseInternalLinkTooltipOptions): InternalLinkTooltipState => {
  const activeTooltipKeyRef = useRef<string | null>(null);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const tooltipCacheRef = useRef<Map<string, string | null>>(new Map());
  const [tooltip, setTooltip] = useState<InternalLinkTooltipState>(emptyInternalLinkTooltip);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const hideTooltip = (link?: HTMLAnchorElement, sync = false): void => {
      if (activeLinkRef.current) delete activeLinkRef.current.dataset.keywordHoverKey;
      if (link) delete link.dataset.keywordHoverKey;
      activeTooltipKeyRef.current = null;
      activeLinkRef.current = null;

      if (sync) {
        flushSync(() => setTooltip(emptyInternalLinkTooltip));
        return;
      }

      setTooltip(emptyInternalLinkTooltip);
    };

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

    const showTooltipForLink = (event: MouseEvent, link: HTMLAnchorElement): void => {
      const filePath = link.getAttribute('data-path');
      const name = link.textContent?.trim();
      if (!filePath || !name) return;

      const cacheKey = `${filePath}::${name}`;
      if (activeTooltipKeyRef.current === cacheKey) return;

      if (activeLinkRef.current && activeLinkRef.current !== link) {
        delete activeLinkRef.current.dataset.keywordHoverKey;
      }

      activeTooltipKeyRef.current = cacheKey;
      activeLinkRef.current = link;
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

    const onMouseOver = (event: MouseEvent): void => {
      const link = closestInternalLink(event.target);
      if (!link || !container.contains(link)) return;

      const related = event.relatedTarget;
      if (related instanceof Node && link.contains(related)) return;

      showTooltipForLink(event, link);
    };

    const onMouseOut = (event: MouseEvent): void => {
      const link = closestInternalLink(event.target);
      if (!link || !container.contains(link)) return;

      const related = event.relatedTarget;
      if (related instanceof Node && link.contains(related)) return;

      hideTooltip(link);
    };

    const onDocumentPointerDown = (event: Event): void => {
      const link = closestInternalLink(event.target);
      if (!link || !container.contains(link)) return;

      hideTooltip(link, true);
    };

    const onDocumentClick = (event: MouseEvent): void => {
      const link = closestInternalLink(event.target);
      if (!link || !container.contains(link)) return;

      event.preventDefault();
      hideTooltip(link, true);

      const filePath = link.getAttribute('data-path');
      if (filePath) onOpenInternalLink(filePath);
    };

    container.addEventListener('mouseover', onMouseOver);
    container.addEventListener('mouseout', onMouseOut);
    document.addEventListener('pointerdown', onDocumentPointerDown, true);
    document.addEventListener('click', onDocumentClick, true);

    return () => {
      container.removeEventListener('mouseover', onMouseOver);
      container.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('pointerdown', onDocumentPointerDown, true);
      document.removeEventListener('click', onDocumentClick, true);
      hideTooltip();
    };
  }, [containerRef, onOpenInternalLink]);

  return tooltip;
};
