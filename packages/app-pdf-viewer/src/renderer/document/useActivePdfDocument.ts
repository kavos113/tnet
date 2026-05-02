import { useEffect, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPdfDocument } from './pdfDocumentLoader';

export const useActivePdfDocument = ({
  rootPath,
  filePath
}: {
  rootPath: string;
  filePath?: string;
}): { pdfDocument: PDFDocumentProxy | null; error: string; isLoading: boolean } => {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let canceled = false;
    let release: (() => void) | null = null;
    setPdfDocument(null);
    setError('');
    if (!rootPath || !filePath) return;

    setIsLoading(true);
    loadPdfDocument(rootPath, filePath)
      .then((loaded) => {
        release = loaded.release;
        if (canceled) {
          release();
          release = null;
          return;
        }
        setPdfDocument(loaded.pdfDocument);
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load active PDF document', loadError);
        if (!canceled) setError('Failed to load PDF.');
      })
      .finally(() => {
        if (!canceled) setIsLoading(false);
      });

    return () => {
      canceled = true;
      release?.();
    };
  }, [filePath, rootPath]);

  return { pdfDocument, error, isLoading };
};
