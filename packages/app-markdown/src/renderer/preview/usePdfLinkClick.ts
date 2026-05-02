import { type RefObject, useEffect } from 'react';
import { closestPdfLink } from './tooltip/pdfLinkTarget';

interface UsePdfLinkClickOptions {
  containerRef: RefObject<HTMLDivElement | null>;
  onOpenPdfLink?: (href: string) => void;
}

export const usePdfLinkClick = ({ containerRef, onOpenPdfLink }: UsePdfLinkClickOptions): void => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onOpenPdfLink) return;

    const onDocumentClick = (event: MouseEvent): void => {
      const link = closestPdfLink(event.target);
      if (!link || !container.contains(link)) return;

      event.preventDefault();
      const href = link.getAttribute('data-pdf-target') ?? link.getAttribute('href');
      if (href) onOpenPdfLink(href);
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [containerRef, onOpenPdfLink]);
};
