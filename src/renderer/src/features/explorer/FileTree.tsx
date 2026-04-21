import type { FileItem } from '@shared/types/file';
import { FileTreeItem } from './FileTreeItem';

interface FileTreeProps {
  items: FileItem[];
}

export const FileTree = ({ items }: FileTreeProps): React.JSX.Element => {
  return (
    <ul className="file-tree">
      {items.map((item) => (
        <FileTreeItem key={item.path} item={item} />
      ))}
    </ul>
  );
};
