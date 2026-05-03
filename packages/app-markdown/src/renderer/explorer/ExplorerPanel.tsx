import { useEffect, useRef, useState } from 'react';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { WorkspaceSwitcher } from '@tnet/ui';
import { FileTree } from './FileTree';
import { SearchPanel, type SearchPanelHandle } from './SearchPanel';
import { useExplorerActions } from './useExplorerActions';
import { useExplorerShortcuts } from './useExplorerShortcuts';
import styles from './ExplorerPanel.module.css';

export const ExplorerPanel = (): React.JSX.Element => {
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

  return (
    <aside className={styles.panel}>
      <WorkspaceSwitcher
        roots={workspaceRoots}
        activeRoot={rootPath}
        ariaLabel="Workspaces"
        openLabel="Open workspace"
        onSwitchRoot={(workspaceRoot) => {
          switchWorkspaceRoot(workspaceRoot).catch((error: unknown) => {
            console.error('Failed to switch workspace', error);
          });
        }}
        onOpenRoot={() => {
          openWorkspace().catch((error: unknown) => {
            console.error('Failed to open workspace', error);
          });
        }}
      />
      <div className={styles.content}>
        <header className={styles.header}>
          <span className={styles.title}>{activeView === 'files' ? 'Files' : 'Search'}</span>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.iconButton} material-symbols-rounded ${
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
              className={`${styles.iconButton} material-symbols-rounded ${
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
