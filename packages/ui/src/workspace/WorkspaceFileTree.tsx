import { useEffect, useRef } from 'react';
import type { FileItem } from '@tnet/shared/types/file';
import styles from './WorkspaceFileTree.module.css';

export type WorkspaceNewEntryMode = 'file' | 'directory';

export interface WorkspaceNewEntryState {
  isActive: boolean;
  mode: WorkspaceNewEntryMode;
  parentPath: string | null;
  name: string;
}

export interface WorkspaceRenameEntryState {
  isActive: boolean;
  targetPath: string | null;
  name: string;
}

export interface WorkspaceFileTreeProps {
  items: FileItem[];
  selectedPath?: string | null;
  expandedPaths?: string[];
  newEntry?: WorkspaceNewEntryState;
  renameEntry?: WorkspaceRenameEntryState;
  onActivateItem: (item: FileItem) => void | Promise<void>;
  onNewEntryNameChange?: (name: string) => void;
  onRenameEntryNameChange?: (name: string) => void;
  onConfirmNewEntry?: () => void | Promise<void>;
  onCancelNewEntry?: () => void;
  onConfirmRenameEntry?: () => void | Promise<void>;
  onCancelRenameEntry?: () => void;
  getItemIcon?: (item: FileItem, isExpanded: boolean) => string;
  isItemDisabled?: (item: FileItem) => boolean;
}

export const WorkspaceFileTree = ({ items, ...itemProps }: WorkspaceFileTreeProps) => {
  return (
    <>
      {items.map((item) => (
        <WorkspaceFileTreeItem key={item.path} item={item} {...itemProps} />
      ))}
    </>
  );
};

type WorkspaceFileTreeItemProps = Omit<WorkspaceFileTreeProps, 'items'> & { item: FileItem };

const WorkspaceFileTreeItem = ({
  item,
  selectedPath = null,
  expandedPaths = [],
  newEntry,
  renameEntry,
  onActivateItem,
  onNewEntryNameChange,
  onRenameEntryNameChange,
  onConfirmNewEntry,
  onCancelNewEntry,
  onConfirmRenameEntry,
  onCancelRenameEntry,
  getItemIcon,
  isItemDisabled
}: WorkspaceFileTreeItemProps): React.JSX.Element => {
  const newEntryInputRef = useRef<HTMLInputElement | null>(null);
  const renameInputRef = useRef<HTMLInputElement | null>(null);
  const isExpanded = expandedPaths.includes(item.path);
  const isSelected = item.path === selectedPath;
  const isDisabled = Boolean(isItemDisabled?.(item));
  const shouldShowNewEntryHere = newEntry?.isActive && newEntry.parentPath === item.path;
  const shouldShowRenameHere = renameEntry?.isActive && renameEntry.targetPath === item.path;
  const icon = getItemIcon?.(item, isExpanded) ?? defaultIcon(item, isExpanded);

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

  const activate = (): void => {
    if (isDisabled) return;
    Promise.resolve(onActivateItem(item)).catch((error: unknown) => {
      console.error('Failed to activate workspace file tree item', error);
    });
  };

  const onNewEntryKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      Promise.resolve(onConfirmNewEntry?.()).catch((error: unknown) => {
        console.error('Failed to create entry', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelNewEntry?.();
    }
  };

  const onRenameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    event.stopPropagation();
    if (event.key === 'Enter') {
      event.preventDefault();
      Promise.resolve(onConfirmRenameEntry?.()).catch((error: unknown) => {
        console.error('Failed to rename entry', error);
      });
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onCancelRenameEntry?.();
    }
  };

  return (
    <li>
      <div
        className={`${styles.treeItem} ${isSelected ? styles.selected : ''} ${
          isDisabled ? styles.disabled : ''
        }`}
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled || undefined}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          activate();
        }}
      >
        {item.isDirectory ? (
          <span
            className={`material-symbols-rounded ${styles.chevron} ${
              isExpanded ? styles.chevronExpanded : ''
            }`}
          >
            chevron_right
          </span>
        ) : null}
        <span
          className={`material-symbols-rounded ${styles.icon} ${item.isDirectory ? styles.folder : ''} ${
            !item.isDirectory ? styles.fileIcon : ''
          }`}
        >
          {icon}
        </span>
        {shouldShowRenameHere ? (
          <input
            ref={renameInputRef}
            className={styles.newInput}
            value={renameEntry?.name ?? ''}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => onRenameEntryNameChange?.(event.target.value)}
            onKeyDown={onRenameKeyDown}
            onBlur={onCancelRenameEntry}
          />
        ) : (
          <p className={styles.name}>{item.name}</p>
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
                  className={`${styles.icon} ${styles.folder} material-symbols-rounded ${
                    newEntry?.mode !== 'directory' ? styles.iconPlaceholder : ''
                  }`}
                >
                  folder
                </span>
                <input
                  ref={newEntryInputRef}
                  className={styles.newInput}
                  value={newEntry?.name ?? ''}
                  onChange={(event) => onNewEntryNameChange?.(event.target.value)}
                  onKeyDown={onNewEntryKeyDown}
                  onBlur={onCancelNewEntry}
                />
              </div>
            </li>
          ) : null}
          <WorkspaceFileTree
            items={item.children}
            selectedPath={selectedPath}
            expandedPaths={expandedPaths}
            newEntry={newEntry}
            renameEntry={renameEntry}
            onActivateItem={onActivateItem}
            onNewEntryNameChange={onNewEntryNameChange}
            onRenameEntryNameChange={onRenameEntryNameChange}
            onConfirmNewEntry={onConfirmNewEntry}
            onCancelNewEntry={onCancelNewEntry}
            onConfirmRenameEntry={onConfirmRenameEntry}
            onCancelRenameEntry={onCancelRenameEntry}
            getItemIcon={getItemIcon}
            isItemDisabled={isItemDisabled}
          />
        </ul>
      ) : null}
    </li>
  );
};

const defaultIcon = (item: FileItem, isExpanded: boolean): string => {
  if (item.isDirectory) return isExpanded ? 'folder_open' : 'folder';
  return 'description';
};
