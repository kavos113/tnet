import { describe, expect, it } from 'vitest';
import { findPdfWorkspaceRootsByName, hasPdfFileInTree } from './pdfLinkResolver';

describe('PDF link resolver helpers', () => {
  it('finds workspace roots by basename', () => {
    expect(findPdfWorkspaceRootsByName(['C:/docs/slides', 'C:/docs/papers'], 'slides')).toEqual([
      'C:/docs/slides'
    ]);
  });

  it('detects PDF files by workspace relative path', () => {
    expect(
      hasPdfFileInTree(
        [
          {
            name: 'docs',
            path: 'C:/workspace/docs',
            isDirectory: true,
            children: [
              {
                name: '0407.pdf',
                path: 'C:/workspace/docs/0407.pdf',
                isDirectory: false
              }
            ]
          }
        ],
        'C:/workspace',
        'docs/0407.pdf'
      )
    ).toBe(true);
  });
});
