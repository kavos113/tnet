import { useEffect, useRef, useState } from 'react';
import { useShortcut } from '@tnet/renderer-core/shortcuts/useShortcut';
import { basename, joinPath, toWorkspaceRelativePath } from '@tnet/shared/path/pathUtils';
import { DirectoryTree } from '@tnet/ui/DirectoryTree/DirectoryTree';
import { usePapersDispatch, usePapersSelector } from './storeHooks';
import { usePapersLibrarySwitcher } from './library/usePapersLibrarySwitcher';
import { papersTnetApi } from './papersTnetApi';
import {
  addExpandedPapersDirectory,
  setPapersDirectoryTree,
  setSelectedPapersDirectory,
  toggleExpandedPapersDirectory
} from './library/librarySlice';

interface NewDirectoryState {
  isActive: boolean;
  parentPath: string | null;
  name: string;
}

const emptyNewDirectory: NewDirectoryState = {
  isActive: false,
  parentPath: null,
  name: ''
};

const libraryLabel = (rootPath: string): string => basename(rootPath) || rootPath;

const libraryInitial = (rootPath: string): string => {
  const label = libraryLabel(rootPath).trim();
  return (label[0] ?? '?').toUpperCase();
};

export const PapersSidebar = (): React.JSX.Element => {
  const dispatch = usePapersDispatch();
  const rootInputRef = useRef<HTMLInputElement | null>(null);
  const [newDirectory, setNewDirectory] = useState<NewDirectoryState>(emptyNewDirectory);
  const activeLibraryRoot = usePapersSelector((state) => state.papersLibrary.activeLibraryRoot);
  const directoryTree = usePapersSelector((state) => state.papersLibrary.directoryTree);
  const expandedDirectoryPaths = usePapersSelector(
    (state) => state.papersLibrary.expandedDirectoryPaths
  );
  const libraryRoots = usePapersSelector((state) => state.papersLibrary.libraryRoots);
  const selectedDirectoryPath = usePapersSelector(
    (state) => state.papersLibrary.selectedDirectoryPath
  );
  const { openLibrary, switchLibrary } = usePapersLibrarySwitcher();
  const shouldShowNewDirectoryAtRoot =
    newDirectory.isActive && newDirectory.parentPath === null && activeLibraryRoot !== '';

  useEffect(() => {
    if (!shouldShowNewDirectoryAtRoot) return;
    rootInputRef.current?.focus();
    rootInputRef.current?.select();
  }, [shouldShowNewDirectoryAtRoot]);

  const startNewDirectory = (): void => {
    if (!activeLibraryRoot) return;
    const parentPath = selectedDirectoryPath;
    if (parentPath) dispatch(addExpandedPapersDirectory(parentPath));
    setNewDirectory({
      isActive: true,
      parentPath,
      name: 'New Folder'
    });
  };

  const cancelNewDirectory = (): void => {
    setNewDirectory(emptyNewDirectory);
  };

  const confirmNewDirectory = async (): Promise<void> => {
    if (!newDirectory.isActive || !activeLibraryRoot) return;

    const directoryName = newDirectory.name.trim();
    if (!directoryName || /[\\/]/.test(directoryName)) {
      cancelNewDirectory();
      return;
    }

    const parentPath = newDirectory.parentPath ?? activeLibraryRoot;
    const targetPath = joinPath(parentPath, directoryName);
    await papersTnetApi.file.createDirectory({
      rootDir: activeLibraryRoot,
      path: toWorkspaceRelativePath(activeLibraryRoot, targetPath)
    });

    const directoryTree = await papersTnetApi.workspace.getFileTree(activeLibraryRoot);
    dispatch(setPapersDirectoryTree(directoryTree));
    if (newDirectory.parentPath) dispatch(addExpandedPapersDirectory(newDirectory.parentPath));
    dispatch(setSelectedPapersDirectory(targetPath));
    cancelNewDirectory();
  };

  const onRootNewDirectoryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmNewDirectory().catch((error: unknown) => {
        console.error('Failed to create paper directory', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelNewDirectory();
    }
  };

  useShortcut({
    key: 'n',
    ctrlOrMeta: true,
    shift: true,
    enabled: Boolean(activeLibraryRoot),
    onTrigger: startNewDirectory
  });

  return (
    <aside className="explorer-panel" aria-label="Papers library">
      <nav className="workspace-switcher" aria-label="Paper libraries">
        {libraryRoots.map((libraryRoot) => (
          <button
            key={libraryRoot}
            type="button"
            className={`workspace-switcher-item ${
              libraryRoot === activeLibraryRoot ? 'workspace-switcher-item-active' : ''
            }`}
            title={libraryRoot}
            aria-label={`Switch to ${libraryLabel(libraryRoot)}`}
            aria-current={libraryRoot === activeLibraryRoot ? 'page' : undefined}
            onClick={() => {
              if (libraryRoot === activeLibraryRoot) return;
              switchLibrary(libraryRoot).catch((error: unknown) => {
                console.error('Failed to switch paper library', error);
              });
            }}
          >
            {libraryInitial(libraryRoot)}
          </button>
        ))}
        <button
          type="button"
          className="workspace-switcher-add material-icons-round"
          aria-label="Open paper library"
          title="Open paper library"
          onClick={() => {
            openLibrary().catch((error: unknown) => {
              console.error('Failed to open paper library', error);
            });
          }}
        >
          add
        </button>
      </nav>
      <div className="explorer-content">
        <header className="sidebar-header">
          <span className="sidebar-title">Papers</span>
        </header>
        <section className="papers-library-summary">
          <span className="papers-library-label">Library</span>
          <strong>
            {activeLibraryRoot ? libraryLabel(activeLibraryRoot) : 'No library selected'}
          </strong>
          {activeLibraryRoot ? (
            <small title={activeLibraryRoot}>{activeLibraryRoot}</small>
          ) : (
            <button type="button" className="open-folder-button" onClick={openLibrary}>
              Open Library
            </button>
          )}
        </section>
        {activeLibraryRoot ? (
          <section className="papers-directory-section" aria-label="Paper directories">
            <button
              type="button"
              className={`file-tree-item papers-all-directories ${
                selectedDirectoryPath === null ? 'file-item-is-selected' : ''
              }`}
              onClick={() => dispatch(setSelectedPapersDirectory(null))}
            >
              <span className="material-icons file-item-folder">folder_special</span>
              <p className="file-item-name">All papers</p>
            </button>
            <ul className="file-explorer-list">
              {shouldShowNewDirectoryAtRoot ? (
                <li className="file-item-new">
                  <div className="file-tree-item">
                    <span className="material-icons-round file-item-chevron file-item-icon-placeholder">
                      chevron_right
                    </span>
                    <span className="material-icons file-item-folder">folder</span>
                    <input
                      ref={rootInputRef}
                      className="file-item-new-input"
                      value={newDirectory.name}
                      onChange={(event) =>
                        setNewDirectory((current) => ({
                          ...current,
                          name: event.target.value
                        }))
                      }
                      onKeyDown={onRootNewDirectoryKeyDown}
                      onBlur={cancelNewDirectory}
                    />
                  </div>
                </li>
              ) : null}
              <DirectoryTree
                items={directoryTree}
                selectedPath={selectedDirectoryPath}
                expandedPaths={expandedDirectoryPaths}
                onSelectDirectory={(directoryPath) =>
                  dispatch(setSelectedPapersDirectory(directoryPath))
                }
                onToggleDirectory={(directoryPath) =>
                  dispatch(toggleExpandedPapersDirectory(directoryPath))
                }
                newEntry={newDirectory}
                onNewEntryNameChange={(name) =>
                  setNewDirectory((current) => ({
                    ...current,
                    name
                  }))
                }
                onConfirmNewEntry={confirmNewDirectory}
                onCancelNewEntry={cancelNewDirectory}
              />
            </ul>
          </section>
        ) : null}
      </div>
    </aside>
  );
};
