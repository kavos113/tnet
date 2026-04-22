import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getClipboardImages, insertImageEmbeds, saveClipboardImages } from './imagePasteExtension';

const makeFile = (content: string, name: string, type: string): File =>
  new File([content], name, { type });

describe('imagePasteExtension', () => {
  let view: EditorView | null = null;

  afterEach(() => {
    view?.destroy();
    view = null;
  });

  it('extracts image files from clipboard data', () => {
    const image = makeFile('image', 'clipboard.png', 'image/png');
    const text = makeFile('text', 'note.txt', 'text/plain');
    const clipboardData = {
      items: [],
      files: [image, text]
    } as unknown as DataTransfer;

    expect(getClipboardImages(clipboardData)).toEqual([
      { file: image, preferredName: 'clipboard.png' }
    ]);
  });

  it('saves clipboard images and returns saved filenames', async () => {
    const savePastedImage = vi.fn().mockResolvedValue('paste-20260101-clipboard.png');

    await expect(
      saveClipboardImages(
        [{ file: makeFile('image', 'clipboard.png', 'image/png'), preferredName: 'clipboard.png' }],
        savePastedImage
      )
    ).resolves.toEqual(['paste-20260101-clipboard.png']);

    expect(savePastedImage).toHaveBeenCalledWith({
      preferredName: 'clipboard.png',
      mimeType: 'image/png',
      contentBase64: btoa('image')
    });
  });

  it('inserts Obsidian image embeds at the current selection', () => {
    view = new EditorView({
      state: EditorState.create({
        doc: 'before after',
        selection: { anchor: 7 }
      })
    });

    insertImageEmbeds(view, ['a.png', 'b.webp']);

    expect(view.state.doc.toString()).toBe('before ![[a.png]]\n![[b.webp]]after');
    expect(view.state.selection.main.from).toBe('before ![[a.png]]\n![[b.webp]]'.length);
  });
});
