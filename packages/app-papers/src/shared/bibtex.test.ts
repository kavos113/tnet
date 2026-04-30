import { describe, expect, it } from 'vitest';
import { parseBibtexMetadata, parseBibtexMetadataResult } from './bibtex';

describe('parseBibtexMetadata', () => {
  it('parses common BibTeX paper metadata', () => {
    expect(
      parseBibtexMetadata(`@inproceedings{paper,
        title = {A {Good} Paper},
        author = {Alice Smith and Bob Jones},
        year = {2024},
        booktitle = {Conference on Testing},
        doi = {10.1000/example},
        url = {https://example.test/paper},
        abstract = {Short abstract}
      }`)
    ).toEqual({
      entryType: 'inproceedings',
      title: 'A Good Paper',
      authors: ['Alice Smith', 'Bob Jones'],
      publishedYear: 2024,
      venue: 'Conference on Testing',
      doi: '10.1000/example',
      url: 'https://example.test/paper',
      abstract: 'Short abstract'
    });
  });

  it('extracts arXiv eprint metadata', () => {
    expect(
      parseBibtexMetadata(`@article{paper,
        title = "Arxiv Paper",
        author = "Alice",
        journal = "arXiv",
        archivePrefix = "arXiv",
        eprint = "2401.12345"
      }`)
    ).toMatchObject({
      entryType: 'article',
      title: 'Arxiv Paper',
      authors: ['Alice'],
      venue: 'arXiv',
      arxivId: '2401.12345'
    });
  });

  it('returns an empty object for non BibTeX input', () => {
    expect(parseBibtexMetadata('plain text')).toEqual({});
  });

  it('keeps nested braces and splits authors only on top level and', () => {
    expect(
      parseBibtexMetadata(`@article{paper,
        title = {Robust {Research and Development} Systems},
        author = {{Research and Development Group} and Alice Smith},
        year = {2026}
      }`)
    ).toMatchObject({
      title: 'Robust Research and Development Systems',
      authors: ['Research and Development Group', 'Alice Smith']
    });
  });

  it('normalizes common LaTeX accents and escaped symbols', () => {
    expect(
      parseBibtexMetadata(`@article{paper,
        title = {M{\\"u}ller \\& G{\\"o}del},
        author = {Jos\\'{e} Garc\\'{i}a}
      }`)
    ).toMatchObject({
      title: 'Müller & Gödel',
      authors: ['José García']
    });
  });

  it('uses venue priority and falls back from date to year', () => {
    expect(
      parseBibtexMetadata(`@misc{paper,
        title = {Dated Paper},
        date = {2025-08-01},
        venue = {Workshop},
        conference = {Conference},
        booktitle = {Proceedings},
        journal = {Journal}
      }`)
    ).toMatchObject({
      publishedYear: 2025,
      venue: 'Journal'
    });

    expect(
      parseBibtexMetadata(`@misc{paper,
        title = {Conference Paper},
        date = {2024},
        venue = {Workshop},
        conference = {Conference}
      }`)
    ).toMatchObject({
      publishedYear: 2024,
      venue: 'Conference'
    });
  });

  it('preserves month and parses keywords as tag candidates', () => {
    expect(
      parseBibtexMetadata(`@article{paper,
        title = {Tagged Paper},
        month = {jan},
        keywords = {ai; retrieval, llm}
      }`)
    ).toMatchObject({
      title: 'Tagged Paper',
      month: 'jan',
      keywords: ['ai', 'retrieval', 'llm']
    });
  });

  it('returns parse diagnostics for invalid or incomplete BibTeX', () => {
    expect(parseBibtexMetadataResult('plain text')).toEqual({
      metadata: {},
      diagnostics: [{ severity: 'error', message: 'BibTeX entry must start with @.' }]
    });

    expect(parseBibtexMetadataResult('@misc{paper, year = {2025}}')).toEqual({
      metadata: { entryType: 'misc', publishedYear: 2025 },
      diagnostics: [{ severity: 'warning', message: 'BibTeX entry does not include a title.' }]
    });
  });
});
