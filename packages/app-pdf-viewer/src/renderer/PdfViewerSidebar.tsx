import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { WorkspaceSwitcher } from '@tnet/ui';
import type { PdfViewerSidebarPanel } from '@tnet/app-pdf-viewer/shared/pdfViewerTypes';
import {
  getPdfViewerGlobalSettings,
  withPdfViewerGlobalSettings
} from '@tnet/app-pdf-viewer/shared/config';
import { PdfSidebarDocumentPanel } from './components/sidebar/PdfSidebarDocumentPanel';
import { PdfSidebarFilesPanel } from './components/sidebar/PdfSidebarFilesPanel';
import { PdfSidebarTabs } from './components/sidebar/PdfSidebarTabs';
import { pdfViewerTnetApi } from './pdfViewerTnetApi';
import { usePdfViewerDispatch, usePdfViewerSelector } from './state/storeHooks';
import {
  openPdf,
  renameOpenedPdfPath,
  setFileTree,
  setPdfViewerError,
  setPdfViewerSidebarPanel,
  setWorkspace
} from './state/pdfViewerSlice';
import styles from './PdfViewerSidebar.module.css';

export const PdfViewerSidebar = (): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const {
    activeIndex,
    activePageByPath,
    activeSidebarPanel,
    documentsByPath,
    fileTree,
    rootPath,
    tabs,
    workspaceRoots
  } = usePdfViewerSelector((state) => state.pdfViewer);
  const activePdfPath = tabs[activeIndex];
  const activeDocument = activePdfPath ? documentsByPath[activePdfPath] : undefined;

  const openWorkspace = (): void => {
    pdfViewerTnetApi.workspace
      .openDirectory()
      .then(async ({ rootPath: nextRootPath, fileTree: nextFileTree }) => {
        if (!nextRootPath) return;
        const nextRoots = Array.from(new Set([...workspaceRoots, nextRootPath]));
        dispatch(
          setWorkspace({
            rootPath: nextRootPath,
            fileTree: nextFileTree,
            workspaceRoots: nextRoots
          })
        );
        await persistWorkspaceRoots(nextRoots, nextRootPath);
      })
      .catch((error: unknown) => {
        console.error('Failed to open PDF workspace', error);
        dispatch(setPdfViewerError('Failed to open workspace.'));
      });
  };

  const switchWorkspace = (workspaceRoot: string): void => {
    pdfViewerTnetApi.workspace
      .getFileTree(workspaceRoot)
      .then(async (nextFileTree) => {
        dispatch(setWorkspace({ rootPath: workspaceRoot, fileTree: nextFileTree, workspaceRoots }));
        await persistWorkspaceRoots(workspaceRoots, workspaceRoot);
      })
      .catch((error: unknown) => {
        console.error('Failed to switch PDF workspace', error);
        dispatch(setPdfViewerError('Failed to switch workspace.'));
      });
  };

  const refresh = (): void => {
    if (!rootPath) return;
    pdfViewerTnetApi.workspace
      .getFileTree(rootPath)
      .then((nextFileTree) => dispatch(setFileTree(nextFileTree)))
      .catch((error: unknown) => {
        console.error('Failed to refresh PDF workspace', error);
        dispatch(setPdfViewerError('Failed to refresh workspace.'));
      });
  };

  return (
    <aside className={styles.panel}>
      <WorkspaceSwitcher
        roots={workspaceRoots}
        activeRoot={rootPath}
        ariaLabel="PDF workspaces"
        openLabel="Open PDF workspace"
        onSwitchRoot={switchWorkspace}
        onOpenRoot={openWorkspace}
      />
      <div className={styles.content}>
        <PdfSidebarTabs
          activePanel={activeSidebarPanel}
          onSelectPanel={(panel) => dispatch(setPdfViewerSidebarPanel(panel))}
        />
        {activeSidebarPanel === 'files' ? (
          <PdfSidebarFilesPanel
            rootPath={rootPath}
            fileTree={fileTree}
            activePdfPath={activePdfPath}
            onRefresh={refresh}
            onOpenPdf={(path) => dispatch(openPdf({ path }))}
            onRenamePdf={(oldPath, newPath) => dispatch(renameOpenedPdfPath({ oldPath, newPath }))}
          />
        ) : (
          <PdfSidebarDocumentPanel
            panel={activeSidebarPanel as Exclude<PdfViewerSidebarPanel, 'files'>}
            rootPath={rootPath}
            activePath={activePdfPath}
            activePage={activePdfPath ? (activePageByPath[activePdfPath] ?? 1) : 1}
            pageCount={activeDocument?.pageCount}
          />
        )}
      </div>
    </aside>
  );
};

const persistWorkspaceRoots = async (
  workspaceRoots: string[],
  activeWorkspaceRoot: string
): Promise<void> => {
  const config = normalizeGlobalConfig(await pdfViewerTnetApi.config.loadGlobal());
  const settings = getPdfViewerGlobalSettings(config);
  await pdfViewerTnetApi.config.saveGlobal(
    withPdfViewerGlobalSettings(config, {
      ...settings,
      workspaceRoots,
      activeWorkspaceRoot
    })
  );
};
