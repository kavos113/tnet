import { useEffect, useRef } from 'react';
import { FileTree } from './FileTree';
import { useExplorerActions } from './useExplorerActions';
import { useExplorerShortcuts } from './useExplorerShortcuts';

export const ExplorerPanel = (): React.JSX.Element => {
  const rootInputRef = useRef<HTMLInputElement | null>(null);
  const {
    rootPath,
    fileTree,
    selectedPath,
    selectedTarget,
    newEntry,
    renameEntry,
    shouldShowNewEntryAtRoot,
    setNewEntryName,
    setRenameEntryName,
    openWorkspace,
    startNewEntry,
    cancelNewEntry,
    confirmNewEntry,
    startRenameEntry,
    cancelRenameEntry,
    confirmRenameEntry,
    deleteSelected
  } = useExplorerActions();

  useEffect(() => {
    if (!shouldShowNewEntryAtRoot) return;
    rootInputRef.current?.focus();
    rootInputRef.current?.select();
  }, [shouldShowNewEntryAtRoot]);

  useExplorerShortcuts({
    rootPath,
    selectedPath,
    selectedTarget,
    startNewEntry,
    startRenameEntry,
    deleteSelected
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
                  onChange={(event) => setNewEntryName(event.target.value)}
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
            onNewEntryNameChange={setNewEntryName}
            onRenameEntryNameChange={setRenameEntryName}
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
