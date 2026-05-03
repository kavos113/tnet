import { useEffect, useRef } from 'react';
import type { FileItem } from '@tnet/shared/types/file';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import { useActiveMarkdownWorkspaceApi } from '@tnet/app-markdown/renderer/workspace/useActiveMarkdownWorkspaceApi';
import type { NewEntryState, RenameEntryState } from './FileTree';
import { selectDirectory, selectFile } from './explorerSlice';
import styles from './FileTreeItem.module.css';

interface FileTreeItemProps {
  item: FileItem;
  newEntry: NewEntryState;
  renameEntry: RenameEntryState;
  onNewEntryNameChange: (name: string) => void;
  onRenameEntryNameChange: (name: string) => void;
  onConfirmNewEntry: () => Promise<void>;
  onCancelNewEntry: () => void;
  onConfirmRenameEntry: () => Promise<void>;
  onCancelRenameEntry: () => void;
}

export const FileTreeItem = ({
  item,
  newEntry,
  renameEntry,
  onNewEntryNameChange,
  onRenameEntryNameChange,
  onConfirmNewEntry,
  onCancelNewEntry,
  onConfirmRenameEntry,
  onCancelRenameEntry
}: FileTreeItemProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveMarkdownWorkspaceApi();
  const newEntryInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const { selectedPath, selectedDirPath, expandedPaths } = useAppSelector(
    (state) => state.explorer
  );

  const isExpanded = expandedPaths.includes(item.path);
  const isSelected = item.path === (selectedPath ?? selectedDirPath);
  const shouldShowNewEntryHere = newEntry.isActive && newEntry.parentPath === item.path;
  const shouldShowRenameHere = renameEntry.isActive && renameEntry.targetPath === item.path;

  useEffect(() => {
    if (!shouldShowNewEntryHere) return;
    newEntryInputRef.current?.focus();
    newEntryInputRef.current?.select();
  }, [shouldShowNewEntryHere]);

  useEffect(() => {
    if (!shouldShowRenameHere) return;
    renameInputRef.current?.focus();
    renameInputRef.current?.select();
  }, [shouldShowRenameHere]);

  const handleClick = async (): Promise<void> => {
    if (item.isDirectory) {
      dispatch(selectDirectory(item.path));
      return;
    }

    dispatch(selectFile(item.path));
    await workspaceApi.openFile(item.path);
  };

  const onNewEntryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      onConfirmNewEntry().catch((error: unknown) => {
        console.error('Failed to create entry', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelNewEntry();
    }
  };

  const onRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      onConfirmRenameEntry().catch((error: unknown) => {
        console.error('Failed to rename entry', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelRenameEntry();
    }
  };

  return (
    <li>
      <div
        className={`${styles.treeItem} ${isSelected ? styles.selected : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          handleClick().catch((error: unknown) => {
            console.error('Failed to open file tree item', error);
          });
        }}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          handleClick().catch((error: unknown) => {
            console.error('Failed to open file tree item', error);
          });
        }}
      >
        {item.isDirectory ? (
          <>
            <span
              className={`material-symbols-rounded ${styles.chevron} ${
                isExpanded ? styles.chevronExpanded : ''
              }`}
            >
              chevron_right
            </span>
            <span className={`material-symbols-rounded ${styles.folder}`}>
              {isExpanded ? 'folder_open' : 'folder'}
            </span>
          </>
        ) : null}
        {shouldShowRenameHere ? (
          <input
            ref={renameInputRef}
            className={styles.newInput}
            value={renameEntry.name}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onRenameEntryNameChange(event.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onCancelRenameEntry}
          />
        ) : (
          <p className={`${styles.name} ${item.isDirectory ? '' : styles.fileName}`}>{item.name}</p>
        )}
      </div>
      {item.isDirectory && item.children && isExpanded ? (
        <ul className={styles.children}>
          {shouldShowNewEntryHere ? (
            <li className={styles.newItem}>
              <div className={styles.treeItem}>
                <span
                  className={`${styles.chevron} material-symbols-rounded ${styles.iconPlaceholder}`}
                >
                  chevron_right
                </span>
                <span
                  className={`${styles.folder} material-symbols-rounded ${
                    newEntry.mode !== 'directory' ? styles.iconPlaceholder : ''
                  }`}
                >
                  folder
                </span>
                <input
                  ref={newEntryInputRef}
                  className={styles.newInput}
                  value={newEntry.name}
                  onChange={(event) => onNewEntryNameChange(event.target.value)}
                  onKeyDown={onNewEntryKeyDown}
                  onBlur={onCancelNewEntry}
                />
              </div>
            </li>
          ) : null}
          {item.children.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              newEntry={newEntry}
              renameEntry={renameEntry}
              onNewEntryNameChange={onNewEntryNameChange}
              onRenameEntryNameChange={onRenameEntryNameChange}
              onConfirmNewEntry={onConfirmNewEntry}
              onCancelNewEntry={onCancelNewEntry}
              onConfirmRenameEntry={onConfirmRenameEntry}
              onCancelRenameEntry={onCancelRenameEntry}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};
