import { useEffect, useRef, useState } from 'react';
import { basename } from '@tnet/shared/path/pathUtils';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { FileTree } from './FileTree';
import { SearchPanel, type SearchPanelHandle } from './SearchPanel';
import { useExplorerActions } from './useExplorerActions';
import { useExplorerShortcuts } from './useExplorerShortcuts';
import styles from './ExplorerPanel.module.css';
import treeStyles from './FileTreeItem.module.css';

const workspaceLabel = (rootPath: string): string => basename(rootPath) || rootPath;

const workspaceInitial = (rootPath: string): string => {
  const label = workspaceLabel(rootPath).trim();
  return (label[0] ?? '?').toUpperCase();
};

export const ExplorerPanel = (): React.JSX.Element => {
  const rootInputRef = useRef<HTMLInputElement | null>(null);
  const searchPanelRef = useRef<SearchPanelHandle | null>(null);
  const [activeView, setActiveView] = useState<'files' | 'search'>('files');
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

  useEffect(() => {
    if (activeView !== 'search') return;
    searchPanelRef.current?.focusInput();
  }, [activeView]);

  useExplorerShortcuts({
    rootPath,
    selectedPath,
    selectedTarget,
    startNewEntry,
    startRenameEntry,
    deleteSelected
  });

  useShortcut({
    key: 'F',
    ctrlOrMeta: true,
    shift: true,
    target: 'document',
    allowInEditable: true,
    onTrigger: () => {
      setActiveView('search');
    }
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
    <aside className={styles.panel}>
      <nav className={styles.workspaceSwitcher} aria-label="Workspaces">
        {workspaceRoots.map((workspaceRoot) => (
          <button
            key={workspaceRoot}
            type="button"
            className={`${styles.workspaceSwitcherItem} ${
              workspaceRoot === rootPath ? styles.workspaceSwitcherItemActive : ''
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
          className={`${styles.workspaceSwitcherAdd} material-icons-round`}
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
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.title}>{activeView === 'files' ? 'Files' : 'Search'}</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.iconButton} material-icons-round ${
                activeView === 'files' ? styles.iconButtonActive : ''
              }`}
              aria-label="Show files"
              title="Files"
              onClick={() => setActiveView('files')}
            >
              folder
            </button>
            <button
              type="button"
              className={`${styles.iconButton} material-icons-round ${
                activeView === 'search' ? styles.iconButtonActive : ''
              }`}
              aria-label="Show search"
              title="Search"
              onClick={() => {
                setActiveView('search');
              }}
            >
              search
            </button>
          </div>
        </header>
        {activeView === 'search' ? (
          <SearchPanel ref={searchPanelRef} />
        ) : rootPath ? (
          <ul className={styles.fileList}>
            {shouldShowNewEntryAtRoot ? (
              <li className={styles.newItem}>
                <div className={treeStyles.treeItem}>
                  <span
                    className={`material-icons-round ${treeStyles.chevron} ${treeStyles.iconPlaceholder}`}
                  >
                    chevron_right
                  </span>
                  <span
                    className={`material-icons ${treeStyles.folder} ${
                      newEntry.mode !== 'directory' ? treeStyles.iconPlaceholder : ''
                    }`}
                  >
                    folder
                  </span>
                  <input
                    ref={rootInputRef}
                    className={treeStyles.newInput}
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
          <div className={styles.empty}>
            <p>No folder selected</p>
            <button type="button" className={styles.openFolderButton} onClick={openWorkspace}>
              Open Folder
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
