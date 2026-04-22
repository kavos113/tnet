import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { useActiveWorkspaceApi } from '@renderer/features/workspace/useActiveWorkspaceApi';
import { markActiveSaved, type EditorGroupId } from './editorSlice';

export const useSaveActiveFile = (
  groupId?: EditorGroupId
): {
  canSave: boolean;
  saveActiveFile: () => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveWorkspaceApi();
  const activeFile = useAppSelector((state) => {
    const targetGroupId = groupId ?? state.editor.activeGroupId;
    const group = state.editor.groups[targetGroupId];
    const activePath =
      group.activeIndex >= 0 && group.activeIndex < group.tabs.length
        ? group.tabs[group.activeIndex]
        : null;
    return activePath ? state.editor.filesByPath[activePath] : null;
  });
  const canSave = useMemo(
    () => Boolean(activeFile && workspaceApi.hasWorkspace),
    [activeFile, workspaceApi.hasWorkspace]
  );

  const saveActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFile || !canSave) return;

    await workspaceApi.writeFile(activeFile.path, activeFile.content);
    const savedContent = await workspaceApi.readFile(activeFile.path);
    dispatch(markActiveSaved({ path: activeFile.path, content: savedContent, groupId }));
  }, [activeFile, canSave, dispatch, groupId, workspaceApi]);

  return { canSave, saveActiveFile };
};
