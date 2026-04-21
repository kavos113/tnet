import type { FileItem } from '@shared/types/file';
import { FileTree } from './FileTree';
import { useExplorerStore } from './explorerStore';

interface FileTreeItemProps {
  item: FileItem;
}

export const FileTreeItem = ({ item }: FileTreeItemProps): React.JSX.Element => {
  const selectedPath = useExplorerStore((state) => state.selectedPath);
  const selectedDirPath = useExplorerStore((state) => state.selectedDirPath);
  const expandedPaths = useExplorerStore((state) => state.expandedPaths);
  const selectFile = useExplorerStore((state) => state.selectFile);
  const selectDirectory = useExplorerStore((state) => state.selectDirectory);

  const isExpanded = expandedPaths.has(item.path);
  const isSelected = item.path === (selectedPath ?? selectedDirPath);

  return (
    <li>
      <button
        className={`file-tree-item ${isSelected ? 'is-selected' : ''}`}
        type="button"
        onClick={() => (item.isDirectory ? selectDirectory(item.path) : selectFile(item.path))}
      >
        <span className="file-tree-icon">{item.isDirectory ? (isExpanded ? '▾' : '▸') : ''}</span>
        <span className="file-tree-name">{item.name}</span>
      </button>
      {item.isDirectory && item.children && isExpanded ? <FileTree items={item.children} /> : null}
    </li>
  );
};
