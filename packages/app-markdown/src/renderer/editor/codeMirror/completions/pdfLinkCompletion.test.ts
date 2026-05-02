import { describe, expect, it } from 'vitest';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import {
  applyPdfDirectoryCompletion,
  pdfLinkCompletion,
  type PdfLinkCompletionWorkspace
} from './pdfLinkCompletion';

const context = (match: { text: string; from: number } | null) =>
  ({
    matchBefore: () => match
  }) as never;

const workspaces: PdfLinkCompletionWorkspace[] = [
  {
    workspaceName: 'slides',
    rootPath: 'C:/workspace/slides',
    directories: ['nested'],
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
          label: 'slides'
        }
      ]
    });
    expect(result?.options[0].apply).toEqual(expect.any(Function));
  });

  it('returns PDF file completions inside a workspace', async () => {
    const result = await pdfLinkCompletion(async () => workspaces)(
      context({ text: 'pdf:slides/04', from: 0 })
    );

    expect(result).toMatchObject({ from: 11 });
    expect(result?.options).toEqual([
      expect.objectContaining({ label: '0407.pdf', apply: '0407.pdf' })
    ]);
  });

  it('returns directory completions inside a workspace', async () => {
    const result = await pdfLinkCompletion(async () => workspaces)(
      context({ text: 'pdf:slides/ne', from: 0 })
    );

    expect(result).toMatchObject({ from: 11 });
    expect(result?.options).toEqual([
      expect.objectContaining({ label: 'nested/' }),
      expect.objectContaining({ label: 'nested/0410.pdf', apply: 'nested/0410.pdf' })
    ]);
    expect(result?.options[0].apply).toEqual(expect.any(Function));
  });

  it('applies directory completions and places the cursor after the inserted slash', () => {
    const parent = document.createElement('div');
    document.body.append(parent);
    const view = new EditorView({
      state: EditorState.create({
        doc: 'pdf:slides/ne',
        selection: { anchor: 'pdf:slides/ne'.length }
      }),
      parent
    });

    applyPdfDirectoryCompletion('nested/')(view, { label: 'nested/' }, 11, 13);

    expect(view.state.doc.toString()).toBe('pdf:slides/nested/');
    expect(view.state.selection.main.head).toBe('pdf:slides/nested/'.length);

    view.destroy();
    parent.remove();
  });
});
