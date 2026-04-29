import { detectPaperIdentifiers } from '../paperIdentifier';
import type { BrowserDetectedPaperSource } from '../types';

export interface PopupTab {
  id?: number;
  url?: string;
  title?: string;
}

export const buildPopupSource = (
  tab: PopupTab | undefined,
  pageMetadata?: BrowserDetectedPaperSource
): BrowserDetectedPaperSource => {
  const fallbackSourceUrl = tab?.url ?? '';
  const identifiers = detectPaperIdentifiers(
    [fallbackSourceUrl, pageMetadata?.sourceUrl, pageMetadata?.canonicalUrl]
      .filter(Boolean)
      .join(' ')
  );

  return {
    sourceUrl: pageMetadata?.sourceUrl || fallbackSourceUrl,
    pageTitle: pageMetadata?.pageTitle || tab?.title || undefined,
    canonicalUrl: pageMetadata?.canonicalUrl,
    doi: pageMetadata?.doi || identifiers.doi,
    arxivId: pageMetadata?.arxivId || identifiers.arxivId,
    pdfUrl: pageMetadata?.pdfUrl || identifiers.pdfUrl,
    title: pageMetadata?.title,
    authors: pageMetadata?.authors,
    publishedYear: pageMetadata?.publishedYear,
    venue: pageMetadata?.venue
  };
};
