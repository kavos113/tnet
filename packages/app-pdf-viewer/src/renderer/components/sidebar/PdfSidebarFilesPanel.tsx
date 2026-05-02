import { useEffect, useState } from 'react';
import { basename, joinPath, toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { WorkspaceFileTree } from '@tnet/ui';
import styles from '../../PdfViewerSidebar.module.css';

export const PdfSidebarFilesPanel = ({
  rootPath,
  fileTree,
  activePdfPath,
  onRefresh,
  onOpenPdf
}: {
  rootPath: string;
  fileTree: FileItem[];
  activePdfPath?: string;
  onRefresh: () => void;
  onOpenPdf: (path: string) => void;
}): React.JSX.Element => {
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);

  useEffect(() => {
    setExpandedPaths([]);
  }, [rootPath]);

  return (
    <>
      <header className={styles.header}>
        <span className={styles.title}>{rootPath ? basename(rootPath) : 'PDFs'}</span>
        <button
          type="button"
          className={`${styles.addButton} material-icons-round`}
          aria-label="Refresh PDF workspace"
          disabled={!rootPath}
          onClick={onRefresh}
        >
          refresh
        </button>
      </header>
      {rootPath ? (
        <ul className={styles.tree}>
          <WorkspaceFileTree
            items={fileTree}
            selectedPath={activePdfPath ? joinPath(rootPath, activePdfPath) : null}
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
              onOpenPdf(toWorkspaceRelativePath(rootPath, item.path));
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
    </>
  );
};

const isPdfItem = (item: FileItem): boolean =>
  !item.isDirectory && item.name.toLowerCase().endsWith('.pdf');
