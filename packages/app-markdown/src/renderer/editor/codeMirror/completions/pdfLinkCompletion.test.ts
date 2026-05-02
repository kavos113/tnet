import { describe, expect, it } from 'vitest';
import { pdfLinkCompletion, type PdfLinkCompletionWorkspace } from './pdfLinkCompletion';

const context = (match: { text: string; from: number } | null) =>
  ({
    matchBefore: () => match
  }) as never;

const workspaces: PdfLinkCompletionWorkspace[] = [
  {
    workspaceName: 'slides',
    rootPath: 'C:/workspace/slides',
    files: ['0407.pdf', 'nested/0410.pdf']
  },
  {
    workspaceName: 'papers',
    rootPath: 'C:/workspace/papers',
    files: ['paper.pdf']
  }
];

describe('pdfLinkCompletion', () => {
  it('returns workspace completions after the pdf scheme', async () => {
    const result = await pdfLinkCompletion(async () => workspaces)(
      context({ text: 'pdf:sl', from: 2 })
    );

    expect(result).toMatchObject({
      from: 6,
      options: [
        {
          label: 'slides',
          apply: 'slides/'
        }
      ]
    });
  });

  it('returns PDF file completions inside a workspace', async () => {
    const result = await pdfLinkCompletion(async () => workspaces)(
      context({ text: 'pdf:slides/04', from: 0 })
    );

    expect(result?.options).toEqual([
      expect.objectContaining({ label: '0407.pdf', apply: 'slides/0407.pdf' })
    ]);
  });
});
