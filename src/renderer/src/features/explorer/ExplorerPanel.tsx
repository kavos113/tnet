import { useMemo } from 'react';
import { basename, dirname, joinPath } from '@shared/path/pathUtils';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { closeFileByPath, renameOpenedPath } from '@renderer/features/editor/editorSlice';
import { setFileTree, setWorkspace } from '@renderer/features/workspace/workspaceSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { clearSelection } from './explorerSlice';
import { FileTree } from './FileTree';

export const ExplorerPanel = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const { rootPath, fileTree } = useAppSelector((state) => state.workspace);
  const { selectedPath, selectedDirPath } = useAppSelector((state) => state.explorer);

  const selectedTarget = selectedPath ?? selectedDirPath;
  const selectedParentDir = useMemo(() => {
    if (!rootPath) return '';
    if (selectedDirPath) return selectedDirPath;
    if (selectedPath) return dirname(selectedPath);
    return rootPath;
  }, [rootPath, selectedDirPath, selectedPath]);

  const refreshTree = async (): Promise<void> => {
    if (!rootPath) return;
    dispatch(setFileTree(await tnetApi.workspace.getFileTree(rootPath)));
  };

  const openWorkspace = async (): Promise<void> => {
    const result = await tnetApi.workspace.openDirectory();
    if (!result.rootPath) return;

    dispatch(setWorkspace(result));
    await tnetApi.config.saveGlobal({ lastOpenedDirectory: result.rootPath });
  };

  const createEntry = async (mode: 'file' | 'directory'): Promise<void> => {
    if (!rootPath) return;

    const defaultName = mode === 'file' ? 'New File.md' : 'New Folder';
    const rawName = window.prompt(
      mode === 'file' ? 'New file name' : 'New folder name',
      defaultName
    );
    const name = rawName?.trim();
    if (!name) return;

    const nextName = mode === 'file' && !name.toLowerCase().endsWith('.md') ? `${name}.md` : name;
    const targetPath = joinPath(selectedParentDir || rootPath, nextName);

    if (mode === 'file') await tnetApi.file.create(targetPath);
    else await tnetApi.file.createDirectory(targetPath);

    await refreshTree();
  };

  const renameSelected = async (): Promise<void> => {
    if (!rootPath || !selectedTarget) return;

    const rawName = window.prompt('Rename', basename(selectedTarget));
    const name = rawName?.trim();
    if (!name) return;

    const newPath = joinPath(dirname(selectedTarget), name);
    if (newPath === selectedTarget) return;

    await tnetApi.file.rename(selectedTarget, newPath, rootPath);
    dispatch(renameOpenedPath({ oldPath: selectedTarget, newPath }));
    dispatch(clearSelection());
    await refreshTree();
  };

  const deleteSelected = async (): Promise<void> => {
    if (!rootPath || !selectedPath) return;
    if (!window.confirm(`Delete ${basename(selectedPath)}?`)) return;

    await tnetApi.file.delete(selectedPath, rootPath);
    dispatch(closeFileByPath(selectedPath));
    dispatch(clearSelection());
    await refreshTree();
  };

  return (
    <aside className="explorer-panel">
      <div className="sidebar-header">
        <span className="sidebar-title">Files</span>
        <div className="explorer-actions">
          <button
            type="button"
            className="icon-button"
            aria-label="Open workspace"
            onClick={openWorkspace}
          >
            O
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="New file"
            disabled={!rootPath}
            onClick={() => {
              createEntry('file').catch((error: unknown) => {
                console.error('Failed to create file', error);
              });
            }}
          >
            +
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="New folder"
            disabled={!rootPath}
            onClick={() => {
              createEntry('directory').catch((error: unknown) => {
                console.error('Failed to create directory', error);
              });
            }}
          >
            F
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Rename selected"
            disabled={!selectedTarget}
            onClick={() => {
              renameSelected().catch((error: unknown) => {
                console.error('Failed to rename', error);
              });
            }}
          >
            R
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="Delete selected file"
            disabled={!selectedPath}
            onClick={() => {
              deleteSelected().catch((error: unknown) => {
                console.error('Failed to delete file', error);
              });
            }}
          >
            D
          </button>
        </div>
      </div>
      {rootPath ? (
        <FileTree items={fileTree} />
      ) : (
        <div className="empty-workspace">
          <button type="button" className="primary-button" onClick={openWorkspace}>
            Open Folder
          </button>
        </div>
      )}
    </aside>
  );
};
