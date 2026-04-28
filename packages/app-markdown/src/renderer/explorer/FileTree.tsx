import type { FileItem } from '@tnet/shared/types/file';
import { FileTreeItem } from './FileTreeItem';

export type NewEntryMode = 'file' | 'directory';

export interface NewEntryState {
  isActive: boolean;
  mode: NewEntryMode;
  parentPath: string | null;
  name: string;
}

export interface RenameEntryState {
  isActive: boolean;
  targetPath: string | null;
  name: string;
}

interface FileTreeProps {
  items: FileItem[];
  newEntry: NewEntryState;
  renameEntry: RenameEntryState;
  onNewEntryNameChange: (name: string) => void;
  onRenameEntryNameChange: (name: string) => void;
  onConfirmNewEntry: () => Promise<void>;
  onCancelNewEntry: () => void;
  onConfirmRenameEntry: () => Promise<void>;
  onCancelRenameEntry: () => void;
}

export const FileTree = ({ items, ...itemProps }: FileTreeProps): React.JSX.Element => {
  return (
    <>
      {items.map((item) => (
        <FileTreeItem key={item.path} item={item} {...itemProps} />
      ))}
    </>
  );
};
