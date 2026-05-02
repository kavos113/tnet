import { type RefObject } from 'react';
import { usePdfLinkClick } from './usePdfLinkClick';

interface PdfLinkClickControllerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onOpenPdfLink?: (href: string) => void;
}

export const PdfLinkClickController = ({
  containerRef,
  onOpenPdfLink
}: PdfLinkClickControllerProps): null => {
  usePdfLinkClick({ containerRef, onOpenPdfLink });
  return null;
};
