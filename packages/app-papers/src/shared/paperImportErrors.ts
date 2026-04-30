const REQUIRED_FIELD_LABELS: Record<string, string> = {
  libraryRoot: 'Paper library',
  'library root': 'Paper library',
  sourcePath: 'PDF file',
  'source path': 'PDF file',
  fileName: 'PDF file name',
  'file name': 'PDF file name',
  pdfBytes: 'PDF file',
  'pdf bytes': 'PDF file',
  title: 'Title'
};

export const formatPaperImportError = (error: unknown): string => {
  const message = normalizeErrorMessage(error);
  if (!message) return 'Failed to import paper.';

  const requiredField = message.match(/^(.+?) is required\.?$/i);
  if (requiredField) {
    const field = requiredField[1].trim();
    return `${REQUIRED_FIELD_LABELS[field] ?? sentenceCase(field)} is required.`;
  }

  if (/relative path must stay inside the library/i.test(message)) {
    return 'Destination directory must stay inside the paper library.';
  }

  if (/library root is required/i.test(message)) {
    return 'Paper library is required.';
  }

  return sentenceCase(message.replace(/\.$/, '')) + '.';
};

const normalizeErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') return stripRpcPrefix(error);
  if (error instanceof Error) return stripRpcPrefix(error.message);
  return '';
};

const stripRpcPrefix = (message: string): string =>
  message
    .trim()
    .replace(/^\[invalid_argument\]\s*/i, '')
    .replace(/^\d+\s+INVALID_ARGUMENT:\s*/i, '')
    .replace(/^INVALID_ARGUMENT:\s*/i, '')
    .trim();

const sentenceCase = (value: string): string =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
