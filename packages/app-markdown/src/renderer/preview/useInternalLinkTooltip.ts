import { type RefObject, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  emptyInternalLinkTooltip,
  type InternalLinkTooltipState
} from './internalLinkTooltipState';
import { markdownService } from './markdown/markdownService';
import { closestInternalLink, isInsideSameLink } from './tooltip/internalLinkTarget';
import { KeywordTooltipCache } from './tooltip/keywordTooltipCache';
import { getTooltipPosition } from './tooltip/tooltipPosition';

interface UseInternalLinkTooltipOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  onOpenInternalLink: (filePath: string) => void;
  loadKeywordContent: (filePath: string, name: string) => Promise<string | null>;
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

export const useInternalLinkTooltip = ({
  containerRef,
  onOpenInternalLink,
  loadKeywordContent
}: UseInternalLinkTooltipOptions): InternalLinkTooltipState => {
  const activeTooltipKeyRef = useRef<string | null>(null);
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const tooltipCacheRef = useRef(new KeywordTooltipCache());
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
      const tooltipHtml = await markdownService.parseTooltipMarkdown(content);
      if (activeTooltipKeyRef.current !== expectedKey) return;
      const { x, y } = getTooltipPosition(event, container.getBoundingClientRect());

      setTooltip({
        visible: true,
        x,
        y,
        html: tooltipHtml
      });
    };

    const showTooltipForLink = (event: MouseEvent, link: HTMLAnchorElement): void => {
      const filePath = link.getAttribute('data-path');
      const name = link.textContent?.trim();
      if (!filePath || !name) return;

      const cacheKey = KeywordTooltipCache.key(filePath, name);
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

      loadKeywordContent(filePath, name)
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

      if (isInsideSameLink(link, event.relatedTarget)) return;

      showTooltipForLink(event, link);
    };

    const onMouseOut = (event: MouseEvent): void => {
      const link = closestInternalLink(event.target);
      if (!link || !container.contains(link)) return;

      if (isInsideSameLink(link, event.relatedTarget)) return;

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
  }, [containerRef, loadKeywordContent, onOpenInternalLink]);

  return tooltip;
};
