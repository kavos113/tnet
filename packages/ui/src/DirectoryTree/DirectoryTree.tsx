import { useEffect, useRef } from 'react';
import type { FileItem } from '@tnet/shared/types/file';

export interface DirectoryTreeNewEntry {
  isActive: boolean;
  parentPath: string | null;
  name: string;
}

export interface DirectoryTreeProps {
  items: FileItem[];
  selectedPath: string | null;
  expandedPaths: string[];
  onSelectDirectory: (path: string) => void;
  onToggleDirectory: (path: string) => void;
  newEntry?: DirectoryTreeNewEntry;
  onNewEntryNameChange?: (name: string) => void;
  onConfirmNewEntry?: () => Promise<void>;
  onCancelNewEntry?: () => void;
}

const directoryItems = (items: FileItem[]): FileItem[] => items.filter((item) => item.isDirectory);

interface DirectoryTreeItemProps extends DirectoryTreeProps {
  item: FileItem;
}

const DirectoryTreeItem = ({
  item,
  selectedPath,
  expandedPaths,
  onSelectDirectory,
  onToggleDirectory,
  newEntry,
  onNewEntryNameChange,
  onConfirmNewEntry,
  onCancelNewEntry
}: DirectoryTreeItemProps): React.JSX.Element => {
  const newEntryInputRef = useRef<HTMLInputElement | null>(null);
  const childDirectories = directoryItems(item.children ?? []);
  const isExpanded = expandedPaths.includes(item.path);
  const isSelected = selectedPath === item.path;
  const shouldShowNewEntryHere = newEntry?.isActive === true && newEntry.parentPath === item.path;

  useEffect(() => {
    if (!shouldShowNewEntryHere) return;
    newEntryInputRef.current?.focus();
    newEntryInputRef.current?.select();
  }, [shouldShowNewEntryHere]);

  const selectDirectory = (): void => {
    onSelectDirectory(item.path);
    if (childDirectories.length > 0) onToggleDirectory(item.path);
  };

  const onNewEntryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      onConfirmNewEntry?.().catch((error: unknown) => {
        console.error('Failed to create directory', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelNewEntry?.();
    }
  };

  return (
    <li>
      <div
        className={`file-tree-item ${isSelected ? 'file-item-is-selected' : ''}`}
        role="button"
        tabIndex={0}
        onClick={selectDirectory}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          selectDirectory();
        }}
      >
        <span
          className={`material-icons-round file-item-chevron ${
            isExpanded ? 'file-item-chevron-expand' : ''
          } ${childDirectories.length === 0 ? 'file-item-icon-placeholder' : ''}`}
        >
          chevron_right
        </span>
        <span className="material-icons file-item-folder">
          {isExpanded ? 'folder_open' : 'folder'}
        </span>
        <p className="file-item-name">{item.name}</p>
      </div>
      {isExpanded && (childDirectories.length > 0 || shouldShowNewEntryHere) ? (
        <ul className="file-item-children">
          {shouldShowNewEntryHere ? (
            <li className="file-item-new">
              <div className="file-tree-item">
                <span className="material-icons-round file-item-chevron file-item-icon-placeholder">
                  chevron_right
                </span>
                <span className="material-icons file-item-folder">folder</span>
                <input
                  ref={newEntryInputRef}
                  className="file-item-new-input"
                  value={newEntry?.name ?? ''}
                  onChange={(event) => onNewEntryNameChange?.(event.target.value)}
                  onKeyDown={onNewEntryKeyDown}
                  onBlur={onCancelNewEntry}
                />
              </div>
            </li>
          ) : null}
          {childDirectories.map((child) => (
            <DirectoryTreeItem
              key={child.path}
              item={child}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onSelectDirectory={onSelectDirectory}
              onToggleDirectory={onToggleDirectory}
              items={childDirectories}
              newEntry={newEntry}
              onNewEntryNameChange={onNewEntryNameChange}
              onConfirmNewEntry={onConfirmNewEntry}
              onCancelNewEntry={onCancelNewEntry}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export const DirectoryTree = ({
  items,
  selectedPath,
  expandedPaths,
  onSelectDirectory,
  onToggleDirectory,
  newEntry,
  onNewEntryNameChange,
  onConfirmNewEntry,
  onCancelNewEntry
}: DirectoryTreeProps): React.JSX.Element => (
  <>
    {directoryItems(items).map((item) => (
      <DirectoryTreeItem
        key={item.path}
        item={item}
        items={items}
        selectedPath={selectedPath}
        expandedPaths={expandedPaths}
        onSelectDirectory={onSelectDirectory}
        onToggleDirectory={onToggleDirectory}
        newEntry={newEntry}
        onNewEntryNameChange={onNewEntryNameChange}
        onConfirmNewEntry={onConfirmNewEntry}
        onCancelNewEntry={onCancelNewEntry}
      />
    ))}
  </>
);
