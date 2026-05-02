import { basename, toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { normalizeGlobalConfig } from '@tnet/shared/types/config';
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
  const { fileTree, rootPath, workspaceRoots } = usePdfViewerSelector((state) => state.pdfViewer);

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
      <nav className={styles.workspaceSwitcher} aria-label="PDF workspaces">
        {workspaceRoots.map((workspaceRoot) => (
          <button
            key={workspaceRoot}
            type="button"
            className={`${styles.workspaceButton} ${
              workspaceRoot === rootPath ? styles.workspaceButtonActive : ''
            }`}
            title={workspaceRoot}
            aria-label={`Switch to ${basename(workspaceRoot)}`}
            onClick={() => switchWorkspace(workspaceRoot)}
          >
            {(basename(workspaceRoot)[0] ?? '?').toUpperCase()}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.addButton} material-icons-round`}
          aria-label="Open PDF workspace"
          onClick={openWorkspace}
        >
          add
        </button>
      </nav>
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
            <PdfFileTree items={fileTree} rootPath={rootPath} />
          </ul>
        ) : (
          <div className={styles.empty}>Open a folder to browse PDFs.</div>
        )}
      </div>
    </aside>
  );
};

const PdfFileTree = ({
  items,
  rootPath
}: {
  items: FileItem[];
  rootPath: string;
}): React.JSX.Element => {
  const dispatch = usePdfViewerDispatch();
  return (
    <>
      {items.map((item) => {
        const isPdf = !item.isDirectory && item.name.toLowerCase().endsWith('.pdf');
        return (
          <li key={item.path}>
            <button
              type="button"
              className={`${styles.fileButton} ${!item.isDirectory && !isPdf ? styles.fileButtonDisabled : ''}`}
              disabled={!item.isDirectory && !isPdf}
              onClick={() => {
                if (item.isDirectory) return;
                dispatch(openPdf({ path: toWorkspaceRelativePath(rootPath, item.path) }));
              }}
            >
              <span className="material-icons-round" aria-hidden="true">
                {item.isDirectory ? 'folder' : isPdf ? 'picture_as_pdf' : 'description'}
              </span>
              <span className={styles.fileName}>{item.name}</span>
            </button>
            {item.isDirectory && item.children ? (
              <ul>
                <PdfFileTree items={item.children} rootPath={rootPath} />
              </ul>
            ) : null}
          </li>
        );
      })}
    </>
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
