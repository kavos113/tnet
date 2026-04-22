import { useEffect, useRef } from 'react';
import { basename } from '@shared/path/pathUtils';
import { FileTree } from './FileTree';
import { useExplorerActions } from './useExplorerActions';
import { useExplorerShortcuts } from './useExplorerShortcuts';

const workspaceLabel = (rootPath: string): string => basename(rootPath) || rootPath;

const workspaceInitial = (rootPath: string): string => {
  const label = workspaceLabel(rootPath).trim();
  return (label[0] ?? '?').toUpperCase();
};

export const ExplorerPanel = (): React.JSX.Element => {
  const rootInputRef = useRef<HTMLInputElement | null>(null);
  const {
    rootPath,
    workspaceRoots,
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
    deleteSelected,
    switchWorkspaceRoot
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
      <nav className="workspace-switcher" aria-label="Workspaces">
        {workspaceRoots.map((workspaceRoot) => (
          <button
            key={workspaceRoot}
            type="button"
            className={`workspace-switcher-item ${
              workspaceRoot === rootPath ? 'workspace-switcher-item-active' : ''
            }`}
            title={workspaceRoot}
            aria-label={`Switch to ${workspaceLabel(workspaceRoot)}`}
            aria-current={workspaceRoot === rootPath ? 'page' : undefined}
            onClick={() => {
              if (workspaceRoot === rootPath) return;
              switchWorkspaceRoot(workspaceRoot).catch((error: unknown) => {
                console.error('Failed to switch workspace', error);
              });
            }}
          >
            {workspaceInitial(workspaceRoot)}
          </button>
        ))}
        <button
          type="button"
          className="workspace-switcher-add material-icons-round"
          aria-label="Open workspace"
          title="Open workspace"
          onClick={() => {
            openWorkspace().catch((error: unknown) => {
              console.error('Failed to open workspace', error);
            });
          }}
        >
          add
        </button>
      </nav>
      <div className="explorer-content">
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
      </div>
    </aside>
  );
};
