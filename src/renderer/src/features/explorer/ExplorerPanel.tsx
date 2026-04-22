import { useEffect, useMemo, useRef, useState } from 'react';
import { basename, dirname, joinPath } from '@shared/path/pathUtils';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { closeFileByPath, openFile, renameOpenedPath } from '@renderer/features/editor/editorSlice';
import {
  setFileTree,
  setSettings,
  setWorkspace
} from '@renderer/features/workspace/workspaceSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import {
  addExpandedPath,
  clearSelection,
  replaceSelectedPath,
  selectDirectoryOnly,
  selectFile
} from './explorerSlice';
import { FileTree, type NewEntryMode, type NewEntryState, type RenameEntryState } from './FileTree';

const emptyNewEntry: NewEntryState = {
  isActive: false,
  mode: 'file',
  parentPath: null,
  name: ''
};

const emptyRenameEntry: RenameEntryState = {
  isActive: false,
  targetPath: null,
  name: ''
};

const isEditableTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tagName = target.tagName.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable;
};

export const ExplorerPanel = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const { rootPath, fileTree } = useAppSelector((state) => state.workspace);
  const { selectedPath, selectedDirPath } = useAppSelector((state) => state.explorer);
  const [newEntry, setNewEntry] = useState<NewEntryState>(emptyNewEntry);
  const [renameEntry, setRenameEntry] = useState<RenameEntryState>(emptyRenameEntry);
  const rootInputRef = useRef<HTMLInputElement | null>(null);

  const selectedTarget = selectedPath ?? selectedDirPath;
  const selectedParentDir = useMemo(() => {
    if (!rootPath) return '';
    if (selectedDirPath) return selectedDirPath;
    if (selectedPath) return dirname(selectedPath);
    return rootPath;
  }, [rootPath, selectedDirPath, selectedPath]);
  const shouldShowNewEntryAtRoot =
    newEntry.isActive && newEntry.parentPath === null && rootPath !== '';

  useEffect(() => {
    if (!shouldShowNewEntryAtRoot) return;
    rootInputRef.current?.focus();
    rootInputRef.current?.select();
  }, [shouldShowNewEntryAtRoot]);

  const refreshTree = async (): Promise<void> => {
    if (!rootPath) return;
    dispatch(setFileTree(await tnetApi.workspace.getFileTree(rootPath)));
  };

  const openWorkspace = async (): Promise<void> => {
    const result = await tnetApi.workspace.openDirectory();
    if (!result.rootPath) return;

    dispatch(setWorkspace(result));
    await tnetApi.config.saveGlobal({ lastOpenedDirectory: result.rootPath });
    dispatch(setSettings(await tnetApi.config.loadProject(result.rootPath)));
  };

  const cancelNewEntry = (): void => {
    setNewEntry(emptyNewEntry);
  };

  const cancelRenameEntry = (): void => {
    setRenameEntry(emptyRenameEntry);
  };

  const startNewEntry = (mode: NewEntryMode): void => {
    if (!rootPath) return;

    const targetDir = selectedParentDir || rootPath;
    setNewEntry({
      isActive: true,
      mode,
      parentPath: targetDir === rootPath ? null : targetDir,
      name: mode === 'directory' ? 'New Folder' : 'New File'
    });
    if (targetDir !== rootPath) dispatch(addExpandedPath(targetDir));
  };

  const confirmNewEntry = async (): Promise<void> => {
    if (!newEntry.isActive || !rootPath) return;

    const parent = newEntry.parentPath ?? rootPath;
    const rawName = newEntry.name.trim();
    if (/[\\/]/.test(rawName)) return;

    const name = rawName;
    if (!name) return;

    const nextName =
      newEntry.mode === 'file' && !name.toLowerCase().endsWith('.md') ? `${name}.md` : name;
    const targetPath = joinPath(parent, nextName);

    if (newEntry.mode === 'file') {
      await tnetApi.file.create(targetPath);
      dispatch(selectFile(targetPath));
      dispatch(openFile({ path: targetPath, content: await tnetApi.file.read(targetPath) }));
    } else {
      await tnetApi.file.createDirectory(targetPath);
      dispatch(selectDirectoryOnly(targetPath));
      dispatch(addExpandedPath(parent));
    }

    cancelNewEntry();
    await refreshTree();
  };

  const startRenameEntry = (): void => {
    if (!selectedTarget) return;
    setRenameEntry({
      isActive: true,
      targetPath: selectedTarget,
      name: basename(selectedTarget)
    });
  };

  const confirmRenameEntry = async (): Promise<void> => {
    if (!rootPath || !renameEntry.isActive || !renameEntry.targetPath) return;

    const oldPath = renameEntry.targetPath;
    const name = renameEntry.name.trim();
    if (/[\\/]/.test(name)) return;
    if (!name) return;

    const newPath = joinPath(dirname(oldPath), name);
    if (newPath === oldPath) {
      cancelRenameEntry();
      return;
    }

    await tnetApi.file.rename(oldPath, newPath, rootPath);
    dispatch(renameOpenedPath({ oldPath, newPath }));
    dispatch(replaceSelectedPath({ oldPath, newPath }));
    cancelRenameEntry();
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

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent): void => {
      if (isEditableTarget(event.target)) return;

      if (event.key === 'Delete') {
        if (!selectedPath) return;
        event.preventDefault();
        deleteSelected().catch((error: unknown) => {
          console.error('Failed to delete file', error);
        });
        return;
      }

      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 'r') {
        if (!selectedTarget) return;
        event.preventDefault();
        startRenameEntry();
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        startNewEntry(event.shiftKey ? 'directory' : 'file');
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  });

  const onRootNewEntryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmNewEntry().catch((error: unknown) => {
        console.error('Failed to create entry', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelNewEntry();
    }
  };

  return (
    <aside className="explorer-panel">
      {rootPath ? (
        <ul className="file-explorer-list">
          {shouldShowNewEntryAtRoot ? (
            <li className="file-item-new">
              <div className="file-tree-item">
                <span className="material-icons-round file-item-chevron file-item-icon-placeholder">
                  chevron_right
                </span>
                <span
                  className={`material-icons file-item-folder ${
                    newEntry.mode !== 'directory' ? 'file-item-icon-placeholder' : ''
                  }`}
                >
                  folder
                </span>
                <input
                  ref={rootInputRef}
                  className="file-item-new-input"
                  value={newEntry.name}
                  onChange={(event) =>
                    setNewEntry((current) => ({ ...current, name: event.target.value }))
                  }
                  onKeyDown={onRootNewEntryKeyDown}
                  onBlur={cancelNewEntry}
                />
              </div>
            </li>
          ) : null}
          <FileTree
            items={fileTree}
            newEntry={newEntry}
            renameEntry={renameEntry}
            onNewEntryNameChange={(name) => setNewEntry((current) => ({ ...current, name }))}
            onRenameEntryNameChange={(name) => setRenameEntry((current) => ({ ...current, name }))}
            onConfirmNewEntry={confirmNewEntry}
            onCancelNewEntry={cancelNewEntry}
            onConfirmRenameEntry={confirmRenameEntry}
            onCancelRenameEntry={cancelRenameEntry}
          />
        </ul>
      ) : (
        <div className="file-explorer-empty">
          <p>No folder selected</p>
          <button type="button" className="open-folder-button" onClick={openWorkspace}>
            Open Folder
          </button>
        </div>
      )}
    </aside>
  );
};
