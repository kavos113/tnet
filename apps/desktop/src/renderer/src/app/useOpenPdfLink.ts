import { useCallback } from 'react';
import {
  findPdfWorkspaceRootsByName,
  hasPdfFileInTree
} from '@tnet/app-pdf-viewer/shared/pdfLinkResolver';
import {
  getPdfViewerGlobalSettings,
  withPdfViewerGlobalSettings
} from '@tnet/app-pdf-viewer/shared/config';
import { parsePdfLinkTarget } from '@tnet/app-pdf-viewer/shared/pdfLink';
import {
  openPdf,
  setPdfViewerError,
  setWorkspace as setPdfViewerWorkspace
} from '@tnet/app-pdf-viewer/renderer';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { tnetApi } from '@tnet/renderer-core/tnetApi';
import { useAppDispatch } from './hooks';
import { setActiveApp } from './appSlice';

export const useOpenPdfLink = (): ((href: string) => void) => {
  const dispatch = useAppDispatch();

  return useCallback(
    (href: string): void => {
      const showError = (message: string): void => {
        dispatch(setPdfViewerError(message));
        dispatch(setActiveApp('pdf-viewer'));
      };

      const openLink = async (): Promise<void> => {
        const parsed = parsePdfLinkTarget(href);
        if (!parsed.ok) {
          showError(parsed.error);
          return;
        }

        const config = normalizeGlobalConfig(await tnetApi.config.loadGlobal());
        const settings = getPdfViewerGlobalSettings(config);
        const roots = settings.workspaceRoots;
        const matches = findPdfWorkspaceRootsByName(roots, parsed.target.workspaceName);
        if (matches.length === 0) {
          showError(`PDF workspace not found: ${parsed.target.workspaceName}`);
          return;
        }
        if (matches.length > 1) {
          showError(`PDF workspace name is ambiguous: ${parsed.target.workspaceName}`);
          return;
        }

        const rootPath = matches[0];
        const fileTree = await tnetApi.workspace.getFileTree(rootPath);
        const workspaceRoots = Array.from(new Set([...roots, rootPath]));
        dispatch(setPdfViewerWorkspace({ rootPath, fileTree, workspaceRoots }));

        if (!hasPdfFileInTree(fileTree, rootPath, parsed.target.relativePath)) {
          showError(`PDF file not found: ${parsed.target.relativePath}`);
          return;
        }

        dispatch(setPdfViewerError(undefined));
        dispatch(openPdf({ path: parsed.target.relativePath }));
        dispatch(setActiveApp('pdf-viewer'));
        await tnetApi.config.saveGlobal(
          withPdfViewerGlobalSettings(
            {
              ...config,
              activeAppId: 'pdf-viewer'
            },
            {
              ...settings,
              workspaceRoots,
              activeWorkspaceRoot: rootPath
            }
          )
        );
      };

      openLink().catch((error: unknown) => {
        console.error('Failed to open PDF link', error);
        showError('Failed to open PDF link.');
      });
    },
    [dispatch]
  );
};
