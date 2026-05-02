// @vitest-environment node
import path from 'path';
import { describe, expect, it } from 'vitest';
import { resolvePdfWorkspacePath } from './pdfViewerFileService';

describe('PDF viewer file service', () => {
  it('resolves PDF paths inside the workspace', () => {
    expect(
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'slides/talk.pdf'
      })
    ).toBe(path.resolve('C:/workspace', 'slides/talk.pdf'));
  });

  it('rejects unsafe or non-PDF paths', () => {
    expect(() =>
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: '../secret.pdf'
      })
    ).toThrow('inside the workspace');
    expect(() =>
      resolvePdfWorkspacePath({
        rootDir: 'C:/workspace',
        path: 'notes.txt'
      })
    ).toThrow('PDF');
  });
});
