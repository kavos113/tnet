import { describe, expect, it } from 'vitest';
import { detectPaperIdentifiers } from '../src/paperIdentifier';

describe('detectPaperIdentifiers', () => {
  it('detects DOI, arXiv ID, and PDF URL', () => {
    const testcases = [
      {
        input: 'https://doi.org/10.1000/ABC.Def-1',
        want: { doi: '10.1000/ABC.Def-1' }
      },
      {
        input: 'https://dl.acm.org/doi/10.1145/3477132.3483540',
        want: { doi: '10.1145/3477132.3483540' }
      },
      {
        input: 'https://arxiv.org/abs/2401.12345',
        want: { arxivId: '2401.12345' }
      },
      {
        input: 'https://example.test/paper.pdf',
        want: { pdfUrl: 'https://example.test/paper.pdf' }
      }
    ];

    for (const testcase of testcases) {
      expect(detectPaperIdentifiers(testcase.input), testcase.input).toMatchObject(testcase.want);
    }
  });
});
