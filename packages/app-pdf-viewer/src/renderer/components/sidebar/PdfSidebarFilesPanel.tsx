import { useEffect, useState } from 'react';
import { basename, dirname, joinPath, toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import type { FileItem } from '@tnet/shared/types/file';
import { WorkspaceFileTree } from '@tnet/ui';
import { pdfViewerTnetApi } from '../../pdfViewerTnetApi';
import styles from '../../PdfViewerSidebar.module.css';

export const PdfSidebarFilesPanel = ({
  rootPath,
  fileTree,
  activePdfPath,
  onRefresh,
  onOpenPdf,
  onRenamePdf
}: {
  rootPath: string;
  fileTree: FileItem[];
  activePdfPath?: string;
  onRefresh: () => void;
  onOpenPdf: (path: string) => void;
  onRenamePdf: (oldPath: string, newPath: string) => void;
}): React.JSX.Element => {
  const [expandedPaths, setExpandedPaths] = useState<string[]>([]);
  const [renameEntry, setRenameEntry] = useState({
    isActive: false,
    targetPath: null as string | null,
    name: ''
  });
  const [moveTarget, setMoveTarget] = useState('');
  const [isMoveFormOpen, setIsMoveFormOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    setExpandedPaths([]);
    setMoveTarget('');
    setIsMoveFormOpen(false);
    setActionError('');
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
        <button
          type="button"
          className={`${styles.addButton} material-icons-round`}
          aria-label="Rename active PDF"
          disabled={!rootPath || !activePdfPath}
          onClick={() => {
            if (!rootPath || !activePdfPath) return;
            setRenameEntry({
              isActive: true,
              targetPath: joinPath(rootPath, activePdfPath),
              name: basename(activePdfPath)
            });
          }}
        >
          drive_file_rename_outline
        </button>
        <button
          type="button"
          className={`${styles.addButton} material-icons-round`}
          aria-label="Move active PDF"
          disabled={!rootPath || !activePdfPath}
          onClick={() => {
            if (!activePdfPath) return;
            setMoveTarget(activePdfPath);
            setIsMoveFormOpen((current) => !current);
          }}
        >
          drive_file_move
        </button>
      </header>
      {rootPath && activePdfPath && isMoveFormOpen ? (
        <form
          className={styles.moveForm}
          onSubmit={(event) => {
            event.preventDefault();
            const newPath = moveTarget.trim();
            if (!newPath || newPath === activePdfPath) {
              setIsMoveFormOpen(false);
              return;
            }
            setActionError('');
            pdfViewerTnetApi.file
              .move({ rootDir: rootPath, oldPath: activePdfPath, newPath })
              .then(() => {
                onRenamePdf(activePdfPath, newPath);
                onRefresh();
                setIsMoveFormOpen(false);
              })
              .catch((error: unknown) => {
                console.error('Failed to move PDF workspace file', error);
                setActionError('Failed to move file. Check the destination path.');
              });
          }}
        >
          <input
            aria-label="Move active PDF path"
            value={moveTarget}
            onChange={(event) => setMoveTarget(event.target.value)}
          />
          <button type="submit">Move</button>
        </form>
      ) : null}
      {actionError ? <div className={styles.actionError}>{actionError}</div> : null}
      {rootPath ? (
        <ul className={styles.tree}>
          <WorkspaceFileTree
            items={fileTree}
            selectedPath={activePdfPath ? joinPath(rootPath, activePdfPath) : null}
            expandedPaths={expandedPaths}
            renameEntry={renameEntry}
            onRenameEntryNameChange={(name) =>
              setRenameEntry((current) => ({
                ...current,
                name
              }))
            }
            onCancelRenameEntry={() =>
              setRenameEntry({ isActive: false, targetPath: null, name: '' })
            }
            onConfirmRenameEntry={async () => {
              if (!renameEntry.targetPath) return;
              const oldPath = toWorkspaceRelativePath(rootPath, renameEntry.targetPath);
              const parent = dirname(oldPath);
              const newPath = parent
                ? joinPath(parent, renameEntry.name.trim())
                : renameEntry.name.trim();
              if (!newPath || oldPath === newPath) {
                setRenameEntry({ isActive: false, targetPath: null, name: '' });
                return;
              }
              setActionError('');
              try {
                await pdfViewerTnetApi.file.rename({ rootDir: rootPath, oldPath, newPath });
                onRenamePdf(oldPath, newPath);
                onRefresh();
                setRenameEntry({ isActive: false, targetPath: null, name: '' });
              } catch (error) {
                console.error('Failed to rename PDF workspace file', error);
                setActionError('Failed to rename file. Check the destination name.');
              }
            }}
            onActivateItem={(item) => {
              if (item.isDirectory) {
                setExpandedPaths((current) =>
                  current.includes(item.path)
                    ? current.filter((path) => path !== item.path)
                    : [...current, item.path]
                );
                return;
              }
              if (!isPreviewableItem(item)) return;
              onOpenPdf(toWorkspaceRelativePath(rootPath, item.path));
            }}
            isItemDisabled={(item) => !item.isDirectory && !isPreviewableItem(item)}
            getItemIcon={(item, isExpanded) => {
              if (item.isDirectory) return isExpanded ? 'folder_open' : 'folder';
              return isPreviewableItem(item) ? getPreviewableIcon(item.name) : 'description';
            }}
          />
        </ul>
      ) : (
        <div className={styles.empty}>Open a folder to browse PDFs.</div>
      )}
    </>
  );
};

const isPreviewableItem = (item: FileItem): boolean =>
  !item.isDirectory && /\.(pdf|docx|xlsx|pptx)$/i.test(item.name);

const getPreviewableIcon = (name: string): string => {
  if (name.toLowerCase().endsWith('.pdf')) return 'picture_as_pdf';
  return 'article';
};
