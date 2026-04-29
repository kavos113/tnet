import { detectPaperIdentifiers } from './paperIdentifier';
import type { BrowserDetectedPaperSource } from './types';

export const readPaperPageMetadata = (doc: Document = document): BrowserDetectedPaperSource => {
  const canonicalUrl = queryContent(doc, 'link[rel="canonical"]', 'href');
  const sourceUrl = doc.location?.href ?? canonicalUrl ?? '';
  const identifiers = detectPaperIdentifiers([sourceUrl, canonicalUrl].filter(Boolean).join(' '));

  return {
    sourceUrl,
    pageTitle: doc.title,
    canonicalUrl: canonicalUrl ?? undefined,
    doi:
      queryMeta(doc, ['citation_doi', 'dc.identifier', 'DC.Identifier', 'dc.identifier.doi']) ??
      identifiers.doi,
    arxivId: identifiers.arxivId,
    pdfUrl:
      queryMeta(doc, ['citation_pdf_url']) ??
      queryPDFLink(doc, canonicalUrl ?? sourceUrl) ??
      identifiers.pdfUrl,
    title: queryMeta(doc, ['citation_title', 'dc.title', 'DC.Title', 'og:title']) ?? doc.title,
    authors: firstNonEmptyArray([
      queryMetaAll(doc, 'citation_author'),
      queryMetaAll(doc, 'dc.creator'),
      queryMetaAll(doc, 'DC.Creator')
    ]),
    publishedYear: toYear(queryMeta(doc, ['citation_publication_date', 'citation_date'])),
    venue: queryMeta(doc, ['citation_journal_title', 'citation_conference_title'])
  };
};

const queryMeta = (doc: Document, names: string[]): string | undefined => {
  for (const name of names) {
    const value = queryContent(doc, `meta[name="${name}"]`, 'content');
    if (value) return value;
  }
  return undefined;
};

const queryMetaAll = (doc: Document, name: string): string[] =>
  Array.from(doc.querySelectorAll(`meta[name="${name}"]`))
    .map((element) => element.getAttribute('content')?.trim() ?? '')
    .filter(Boolean);

const queryContent = (doc: Document, selector: string, attribute: string): string | undefined =>
  doc.querySelector(selector)?.getAttribute(attribute)?.trim() || undefined;

const queryPDFLink = (doc: Document, baseUrl: string): string | undefined => {
  const selectors = [
    '#downloadPdfUrl',
    'a[href*="/doi/pdf/"]',
    'a[href$=".pdf"]',
    'a[href*=".pdf?"]'
  ];
  for (const selector of selectors) {
    const href = queryContent(doc, selector, 'href');
    if (href) return new URL(href, baseUrl).toString();
  }
  return undefined;
};

const firstNonEmptyArray = (values: string[][]): string[] => {
  for (const value of values) {
    if (value.length > 0) return value;
  }
  return [];
};

const toYear = (value?: string): number | undefined => {
  const match = value?.match(/\b(19|20)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
};
