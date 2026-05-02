import { useEffect, useState } from 'react';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { getPdfViewerGlobalSettings } from '@tnet/app-pdf-viewer/shared/config';
import { normalizePdfViewerSessionData } from '@tnet/app-pdf-viewer/shared/session';
import { pdfViewerTnetApi } from '../pdfViewerTnetApi';
import { usePdfViewerDispatch } from '../state/storeHooks';
import {
  replaceSession,
  setPdfViewerSettings,
  setWorkspace,
  setWorkspaceRoots
} from '../state/pdfViewerSlice';

export const useRestorePdfViewerWorkspace = (): boolean => {
  const dispatch = usePdfViewerDispatch();
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    let canceled = false;

    const restore = async (): Promise<void> => {
      const config = normalizeGlobalConfig(await pdfViewerTnetApi.config.loadGlobal());
      if (canceled) return;
      const settings = getPdfViewerGlobalSettings(config);
      dispatch(setPdfViewerSettings(settings));

      const workspaceRoots = settings.workspaceRoots;
      const rootPath = settings.activeWorkspaceRoot ?? workspaceRoots[0] ?? '';
      dispatch(setWorkspaceRoots(workspaceRoots));
      if (!rootPath) return;

      const [fileTree, session] = await Promise.all([
        pdfViewerTnetApi.workspace.getFileTree(rootPath),
        pdfViewerTnetApi.session.load(rootPath)
      ]);
      if (canceled) return;

      const normalizedSession = normalizePdfViewerSessionData(session);
      dispatch(setWorkspace({ rootPath, fileTree, workspaceRoots }));
      dispatch(
        replaceSession({
          openedFiles: normalizedSession.apps.pdfViewer.openedFiles,
          activeIndex: normalizedSession.apps.pdfViewer.activeIndex,
          viewStateByPath: normalizedSession.apps.pdfViewer.viewStateByPath
        })
      );
    };

    restore()
      .catch((error: unknown) => {
        console.error('Failed to restore PDF viewer workspace', error);
      })
      .finally(() => {
        if (!canceled) setIsRestoring(false);
      });

    return () => {
      canceled = true;
    };
  }, [dispatch]);

  return isRestoring;
};
