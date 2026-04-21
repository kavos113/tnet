import type { FileItem } from '@shared/types/file';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { openFile } from '@renderer/features/editor/editorSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { FileTree } from './FileTree';
import { selectDirectory, selectFile } from './explorerSlice';

interface FileTreeItemProps {
  item: FileItem;
}

export const FileTreeItem = ({ item }: FileTreeItemProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const { selectedPath, selectedDirPath, expandedPaths } = useAppSelector(
    (state) => state.explorer
  );

  const isExpanded = expandedPaths.includes(item.path);
  const isSelected = item.path === (selectedPath ?? selectedDirPath);

  const handleClick = async (): Promise<void> => {
    if (item.isDirectory) {
      dispatch(selectDirectory(item.path));
      return;
    }

    dispatch(selectFile(item.path));
    const content = await tnetApi.file.read(item.path);
    dispatch(openFile({ path: item.path, content }));
  };

  return (
    <li>
      <button
        className={`file-tree-item ${isSelected ? 'is-selected' : ''}`}
        type="button"
        onClick={() => {
          handleClick().catch((error: unknown) => {
            console.error('Failed to open file tree item', error);
          });
        }}
      >
        <span className="file-tree-icon">{item.isDirectory ? (isExpanded ? 'v' : '>') : ''}</span>
        <span className="file-tree-name">{item.name}</span>
      </button>
      {item.isDirectory && item.children && isExpanded ? <FileTree items={item.children} /> : null}
    </li>
  );
};
