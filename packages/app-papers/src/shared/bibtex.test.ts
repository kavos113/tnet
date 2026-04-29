import { describe, expect, it } from 'vitest';
import { parseBibtexMetadata } from './bibtex';

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
      title: 'Arxiv Paper',
      authors: ['Alice'],
      venue: 'arXiv',
      arxivId: '2401.12345'
    });
  });

  it('returns an empty object for non BibTeX input', () => {
    expect(parseBibtexMetadata('plain text')).toEqual({});
  });
});
