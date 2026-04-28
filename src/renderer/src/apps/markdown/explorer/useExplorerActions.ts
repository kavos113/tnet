import { useMemo, useState } from 'react';
import { basename, dirname, joinPath, toWorkspaceRelativePath } from '@shared/path/pathUtils';
import type { FileItem } from '@shared/types/file';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { closeFileByPath, renameOpenedPath } from '@renderer/apps/markdown/editor/editorSlice';
import { setFileTree } from '@renderer/features/workspace/workspaceSlice';
import { useActiveMarkdownWorkspaceApi } from '@renderer/apps/markdown/workspace/useActiveMarkdownWorkspaceApi';
import { useMarkdownWorkspaceSwitcher } from '@renderer/apps/markdown/workspace/useMarkdownWorkspaceSwitcher';
import { tnetApi } from '@renderer/lib/tnetApi';
import type { NewEntryMode, NewEntryState, RenameEntryState } from './FileTree';
import {
  addExpandedPath,
  clearSelection,
  replaceSelectedPath,
  selectDirectoryOnly,
  selectFile
} from './explorerSlice';

const emptyNewEntry: NewEntryState = {
  isActive: false,
  mode: 'file',
  parentPath: null,
  name: ''
};

const emptyRenameEntry: RenameEntryState = {
  isActive: false,
  targetPath: null,
  name: ''
};

export const useExplorerActions = (): {
  rootPath: string;
  workspaceRoots: string[];
  fileTree: FileItem[];
  selectedPath: string | null;
  selectedTarget: string | null;
  newEntry: NewEntryState;
  renameEntry: RenameEntryState;
  shouldShowNewEntryAtRoot: boolean;
  setNewEntryName: (name: string) => void;
  setRenameEntryName: (name: string) => void;
  openWorkspace: () => Promise<void>;
  switchWorkspaceRoot: (rootPath: string) => Promise<void>;
  startNewEntry: (mode: NewEntryMode) => void;
  cancelNewEntry: () => void;
  confirmNewEntry: () => Promise<void>;
  startRenameEntry: () => void;
  cancelRenameEntry: () => void;
  confirmRenameEntry: () => Promise<void>;
  deleteSelected: () => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveMarkdownWorkspaceApi();
  const { rootPath, workspaceRoots, fileTree } = useAppSelector((state) => state.workspace);
  const { switchWorkspace } = useMarkdownWorkspaceSwitcher();
  const { selectedPath, selectedDirPath } = useAppSelector((state) => state.explorer);
  const [newEntry, setNewEntry] = useState<NewEntryState>(emptyNewEntry);
  const [renameEntry, setRenameEntry] = useState<RenameEntryState>(emptyRenameEntry);

  const selectedTarget = selectedPath ?? selectedDirPath;
  const selectedParentDir = useMemo(() => {
    if (!rootPath) return '';
    if (selectedDirPath) return selectedDirPath;
    if (selectedPath) return dirname(selectedPath);
    return rootPath;
  }, [rootPath, selectedDirPath, selectedPath]);
  const shouldShowNewEntryAtRoot =
    newEntry.isActive && newEntry.parentPath === null && rootPath !== '';

  const refreshTree = async (): Promise<void> => {
    if (!rootPath) return;
    dispatch(setFileTree(await tnetApi.workspace.getFileTree(rootPath)));
  };

  const toWorkspaceRequest = (targetPath: string): { rootDir: string; path: string } => ({
    rootDir: rootPath,
    path: toWorkspaceRelativePath(rootPath, targetPath)
  });

  const openWorkspace = async (): Promise<void> => {
    const result = await tnetApi.workspace.openDirectory();
    if (!result.rootPath) return;

    await switchWorkspace(result.rootPath);
  };

  const cancelNewEntry = (): void => {
    setNewEntry(emptyNewEntry);
  };

  const cancelRenameEntry = (): void => {
    setRenameEntry(emptyRenameEntry);
  };

  const startNewEntry = (mode: NewEntryMode): void => {
    if (!rootPath) return;

    const targetDir = selectedParentDir || rootPath;
    setNewEntry({
      isActive: true,
      mode,
      parentPath: targetDir === rootPath ? null : targetDir,
      name: mode === 'directory' ? 'New Folder' : 'New File'
    });
    if (targetDir !== rootPath) dispatch(addExpandedPath(targetDir));
  };

  const confirmNewEntry = async (): Promise<void> => {
    if (!newEntry.isActive || !rootPath) return;

    const parent = newEntry.parentPath ?? rootPath;
    const rawName = newEntry.name.trim();
    if (/[\\/]/.test(rawName)) return;
    if (!rawName) return;

    const nextName =
      newEntry.mode === 'file' && !rawName.toLowerCase().endsWith('.md')
        ? `${rawName}.md`
        : rawName;
    const targetPath = joinPath(parent, nextName);

    if (newEntry.mode === 'file') {
      await tnetApi.file.create(toWorkspaceRequest(targetPath));
      dispatch(selectFile(targetPath));
      await workspaceApi.openFile(targetPath);
    } else {
      await tnetApi.file.createDirectory(toWorkspaceRequest(targetPath));
      dispatch(selectDirectoryOnly(targetPath));
      dispatch(addExpandedPath(parent));
    }

    cancelNewEntry();
    await refreshTree();
  };

  const startRenameEntry = (): void => {
    if (!selectedTarget) return;
    setRenameEntry({
      isActive: true,
      targetPath: selectedTarget,
      name: basename(selectedTarget)
    });
  };

  const confirmRenameEntry = async (): Promise<void> => {
    if (!rootPath || !renameEntry.isActive || !renameEntry.targetPath) return;

    const oldPath = renameEntry.targetPath;
    const name = renameEntry.name.trim();
    if (/[\\/]/.test(name)) return;
    if (!name) return;

    const newPath = joinPath(dirname(oldPath), name);
    if (newPath === oldPath) {
      cancelRenameEntry();
      return;
    }

    await tnetApi.file.rename({
      rootDir: rootPath,
      oldPath: toWorkspaceRelativePath(rootPath, oldPath),
      newPath: toWorkspaceRelativePath(rootPath, newPath)
    });
    dispatch(renameOpenedPath({ oldPath, newPath }));
    dispatch(replaceSelectedPath({ oldPath, newPath }));
    cancelRenameEntry();
    await refreshTree();
  };

  const deleteSelected = async (): Promise<void> => {
    if (!rootPath || !selectedPath) return;
    if (!window.confirm(`Delete ${basename(selectedPath)}?`)) return;

    await tnetApi.file.delete(toWorkspaceRequest(selectedPath));
    dispatch(closeFileByPath(selectedPath));
    dispatch(clearSelection());
    await refreshTree();
  };

  return {
    rootPath,
    workspaceRoots,
    fileTree,
    selectedPath,
    selectedTarget,
    newEntry,
    renameEntry,
    shouldShowNewEntryAtRoot,
    setNewEntryName: (name) => setNewEntry((current) => ({ ...current, name })),
    setRenameEntryName: (name) => setRenameEntry((current) => ({ ...current, name })),
    openWorkspace,
    switchWorkspaceRoot: switchWorkspace,
    startNewEntry,
    cancelNewEntry,
    confirmNewEntry,
    startRenameEntry,
    cancelRenameEntry,
    confirmRenameEntry,
    deleteSelected
  };
};
