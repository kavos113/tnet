import { describe, expect, it } from 'vitest';
import { readPaperPageMetadata } from '../src/paperPageMetadata';

describe('readPaperPageMetadata', () => {
  it('reads citation metadata from the current document', () => {
    const doc = document.implementation.createHTMLDocument('Fallback title');
    doc.head.innerHTML = `
      <link rel="canonical" href="https://example.test/article">
      <meta name="citation_title" content="Paper title">
      <meta name="citation_author" content="Alice">
      <meta name="citation_author" content="Bob">
      <meta name="citation_doi" content="10.1000/example">
      <meta name="citation_publication_date" content="2024/01/02">
      <meta name="citation_journal_title" content="Journal">
      <meta name="citation_pdf_url" content="https://example.test/paper.pdf">
    `;
    doc.title = 'Fallback title';

    expect(readPaperPageMetadata(doc)).toMatchObject({
      pageTitle: 'Fallback title',
      canonicalUrl: 'https://example.test/article',
      title: 'Paper title',
      authors: ['Alice', 'Bob'],
      doi: '10.1000/example',
      publishedYear: 2024,
      venue: 'Journal',
      pdfUrl: 'https://example.test/paper.pdf'
    });
  });

  it('reads ACM-style PDF links and Dublin Core metadata fallbacks', () => {
    const doc = document.implementation.createHTMLDocument('Fallback title');
    doc.head.innerHTML = `
      <link rel="canonical" href="https://dl.acm.org/doi/10.1145/3477132.3483540">
      <meta name="dc.title" content="Dublin Core title">
      <meta name="dc.creator" content="Alice">
      <meta name="dc.creator" content="Bob">
      <meta name="dc.identifier.doi" content="10.1145/3477132.3483540">
    `;
    doc.body.innerHTML = `
      <a id="downloadPdfUrl" href="/doi/pdf/10.1145/3477132.3483540">PDF</a>
    `;

    expect(readPaperPageMetadata(doc)).toMatchObject({
      canonicalUrl: 'https://dl.acm.org/doi/10.1145/3477132.3483540',
      title: 'Dublin Core title',
      authors: ['Alice', 'Bob'],
      doi: '10.1145/3477132.3483540',
      pdfUrl: 'https://dl.acm.org/doi/pdf/10.1145/3477132.3483540'
    });
  });
});
