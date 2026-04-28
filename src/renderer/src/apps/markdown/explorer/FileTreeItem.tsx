import { useEffect, useRef } from 'react';
import type { FileItem } from '@shared/types/file';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { useActiveMarkdownWorkspaceApi } from '@renderer/apps/markdown/workspace/useActiveMarkdownWorkspaceApi';
import type { NewEntryState, RenameEntryState } from './FileTree';
import { selectDirectory, selectFile } from './explorerSlice';

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
        className={`file-tree-item ${isSelected ? 'file-item-is-selected' : ''}`}
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
              className={`material-icons-round file-item-chevron ${
                isExpanded ? 'file-item-chevron-expand' : ''
              }`}
            >
              chevron_right
            </span>
            <span className="material-icons file-item-folder">
              {isExpanded ? 'folder_open' : 'folder'}
            </span>
          </>
        ) : null}
        {shouldShowRenameHere ? (
          <input
            ref={renameInputRef}
            className="file-item-new-input"
            value={renameEntry.name}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onRenameEntryNameChange(event.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onCancelRenameEntry}
          />
        ) : (
          <p className={`file-item-name ${item.isDirectory ? '' : 'file-item-not-directory'}`}>
            {item.name}
          </p>
        )}
      </div>
      {item.isDirectory && item.children && isExpanded ? (
        <ul className="file-item-children">
          {shouldShowNewEntryHere ? (
            <li className="file-item-new">
              <div className="file-tree-item">
                <span className="file-item-chevron material-icons-round file-item-icon-placeholder">
                  chevron_right
                </span>
                <span
                  className={`file-item-folder material-icons ${
                    newEntry.mode !== 'directory' ? 'file-item-icon-placeholder' : ''
                  }`}
                >
                  folder
                </span>
                <input
                  ref={newEntryInputRef}
                  className="file-item-new-input"
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
