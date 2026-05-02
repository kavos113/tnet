import { useEffect, useState } from 'react';
import { basename, joinPath, toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
import { WorkspaceFileTree, WorkspaceSwitcher } from '@tnet/ui';
import {
  getPdfViewerGlobalSettings,
  withPdfViewerGlobalSettings
} from '@tnet/app-pdf-viewer/shared/config';
import { pdfViewerTnetApi } from './pdfViewerTnetApi';
import { usePdfViewerDispatch, usePdfViewerSelector } from './state/storeHooks';
import { openPdf, setFileTree, setPdfViewerError, setWorkspace } from './state/pdfViewerSlice';
import styles from './PdfViewerSidebar.module.css';

export const PdfViewerSidebar = (): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  const { activeIndex, fileTree, rootPath, tabs, workspaceRoots } = usePdfViewerSelector(
    (state) => state.pdfViewer
  );
  const activePdfPath =
    rootPath && tabs[activeIndex] ? joinPath(rootPath, tabs[activeIndex]) : null;
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  useEffect(() => {
    setExpandedPaths([]);
  }, [rootPath]);

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
        <header className={styles.header}>
          <span className={styles.title}>{rootPath ? basename(rootPath) : 'PDFs'}</span>
          <button
            type="button"
            className={`${styles.addButton} material-icons-round`}
            aria-label="Refresh PDF workspace"
            disabled={!rootPath}
            onClick={refresh}
          >
            refresh
          </button>
        </header>
        {rootPath ? (
          <ul className={styles.tree}>
            <WorkspaceFileTree
              items={fileTree}
              selectedPath={activePdfPath}
              expandedPaths={expandedPaths}
              onActivateItem={(item) => {
                if (item.isDirectory) {
                  setExpandedPaths((current) =>
                    current.includes(item.path)
                      ? current.filter((path) => path !== item.path)
                      : [...current, item.path]
                  );
                  return;
                }
                if (!isPdfItem(item)) return;
                dispatch(openPdf({ path: toWorkspaceRelativePath(rootPath, item.path) }));
              }}
              isItemDisabled={(item) => !item.isDirectory && !isPdfItem(item)}
              getItemIcon={(item, isExpanded) => {
                if (item.isDirectory) return isExpanded ? 'folder_open' : 'folder';
                return isPdfItem(item) ? 'picture_as_pdf' : 'description';
              }}
            />
          </ul>
        ) : (
          <div className={styles.empty}>Open a folder to browse PDFs.</div>
        )}
      </div>
    </aside>
  );
};

const isPdfItem = (item: FileItem): boolean =>
  !item.isDirectory && item.name.toLowerCase().endsWith('.pdf');

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
