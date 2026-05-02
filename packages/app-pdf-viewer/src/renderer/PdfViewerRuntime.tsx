import { usePersistPdfViewerSession } from './hooks/usePersistPdfViewerSession';
import { useRestorePdfViewerWorkspace } from './hooks/useRestorePdfViewerWorkspace';

export const PdfViewerRuntime = (): null => {
  const isRestoring = useRestorePdfViewerWorkspace();
  usePersistPdfViewerSession({ enabled: !isRestoring });

  return null;
};
