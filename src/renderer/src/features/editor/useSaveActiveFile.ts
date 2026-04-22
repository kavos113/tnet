import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { useActiveWorkspaceApi } from '@renderer/features/workspace/useActiveWorkspaceApi';
import { markActiveSaved } from './editorSlice';

export const useSaveActiveFile = (): {
  canSave: boolean;
  saveActiveFile: () => Promise<void>;
} => {
  const dispatch = useAppDispatch();
  const workspaceApi = useActiveWorkspaceApi();
  const { openedFiles, activeIndex } = useAppSelector((state) => state.editor);
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;
  const canSave = useMemo(
    () => Boolean(activeFile && workspaceApi.hasWorkspace),
    [activeFile, workspaceApi.hasWorkspace]
  );

  const saveActiveFile = useCallback(async (): Promise<void> => {
    if (!activeFile || !canSave) return;

    await workspaceApi.writeFile(activeFile.path, activeFile.content);
    const savedContent = await workspaceApi.readFile(activeFile.path);
    dispatch(markActiveSaved({ content: savedContent }));
  }, [activeFile, canSave, dispatch, workspaceApi]);

  return { canSave, saveActiveFile };
};
