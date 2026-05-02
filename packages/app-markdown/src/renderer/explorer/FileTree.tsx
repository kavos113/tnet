import type { FileItem } from '@tnet/shared/types/file';
import {
  WorkspaceFileTree,
  type WorkspaceNewEntryMode,
  type WorkspaceNewEntryState,
  type WorkspaceRenameEntryState
} from '@tnet/ui';
import { useAppDispatch, useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import { useActiveMarkdownWorkspaceApi } from '@tnet/app-markdown/renderer/workspace/useActiveMarkdownWorkspaceApi';
import { selectDirectory, selectFile } from './explorerSlice';

export type NewEntryMode = WorkspaceNewEntryMode;

export type NewEntryState = WorkspaceNewEntryState;

export type RenameEntryState = WorkspaceRenameEntryState;

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
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveMarkdownWorkspaceApi();
  const { selectedPath, selectedDirPath, expandedPaths } = useAppSelector(
    (state) => state.explorer
  );

  const activateItem = async (item: FileItem): Promise<void> => {
    if (item.isDirectory) {
      dispatch(selectDirectory(item.path));
      return;
    }

    dispatch(selectFile(item.path));
    await workspaceApi.openFile(item.path);
  };

  return (
    <WorkspaceFileTree
      items={items}
      selectedPath={selectedPath ?? selectedDirPath}
      expandedPaths={expandedPaths}
      onActivateItem={activateItem}
      {...itemProps}
    />
  );
};
