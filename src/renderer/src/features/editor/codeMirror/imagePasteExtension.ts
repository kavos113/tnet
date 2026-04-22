import type { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export interface SavePastedImageRequest {
  preferredName?: string;
  mimeType: string;
  contentBase64: string;
}

export type SavePastedImageRequester = (request: SavePastedImageRequest) => Promise<string | null>;

interface ClipboardImage {
  file: File;
  preferredName?: string;
}

const imageMimeTypeFallback = 'image/png';

const fileToBase64 = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

export const getClipboardImages = (dataTransfer: DataTransfer | null): ClipboardImage[] => {
  if (!dataTransfer) return [];

  const itemImages = Array.from(dataTransfer.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null)
    .map((file) => ({ file, preferredName: file.name || undefined }));

  if (itemImages.length > 0) return itemImages;

  return Array.from(dataTransfer.files)
    .filter((file) => file.type.startsWith('image/'))
    .map((file) => ({ file, preferredName: file.name || undefined }));
};

export const insertImageEmbeds = (view: EditorView, filenames: string[]): void => {
  if (filenames.length === 0) return;

  const embedText = filenames.map((filename) => `![[${filename}]]`).join('\n');
  const selection = view.state.selection.main;
  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: embedText
    },
    selection: {
      anchor: selection.from + embedText.length
    },
    scrollIntoView: true
  });
};

export const saveClipboardImages = async (
  images: ClipboardImage[],
  savePastedImage: SavePastedImageRequester
): Promise<string[]> => {
  const filenames: string[] = [];

  for (const image of images) {
    const filename = await savePastedImage({
      preferredName: image.preferredName,
      mimeType: image.file.type || imageMimeTypeFallback,
      contentBase64: await fileToBase64(image.file)
    });
    if (filename) filenames.push(filename);
  }

  return filenames;
};

export const imagePasteExtension = (savePastedImage?: SavePastedImageRequester): Extension =>
  EditorView.domEventHandlers({
    paste: (event, view) => {
      if (!savePastedImage) return false;

      const images = getClipboardImages(event.clipboardData);
      if (images.length === 0) return false;

      event.preventDefault();
      saveClipboardImages(images, savePastedImage)
        .then((filenames) => insertImageEmbeds(view, filenames))
        .catch((error: unknown) => {
          console.error('Failed to paste image', error);
        });
      return true;
    }
  });
