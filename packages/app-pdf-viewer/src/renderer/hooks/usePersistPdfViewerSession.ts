import { useEffect } from 'react';
import { usePdfViewerSelector } from '../state/storeHooks';

export const usePersistPdfViewerSession = ({
  enabled,
  debounceMs = 150
}: {
  enabled: boolean;
  debounceMs?: number;
}): void => {
  const { activeIndex, rootPath, tabs, viewStateByPath } = usePdfViewerSelector(
    (state) => state.pdfViewer
  );

  useEffect(() => {
    if (!enabled || !rootPath) return;
    const timeoutId = window.setTimeout(() => {
      window.tnet.session
        .save(rootPath, {
          explorer: {
            expandedFolders: []
          },
          apps: {
            pdfViewer: {
              openedFiles: tabs,
              activeIndex,
              viewStateByPath
            }
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to save PDF viewer session', error);
        });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeIndex, debounceMs, enabled, rootPath, tabs, viewStateByPath]);
};
