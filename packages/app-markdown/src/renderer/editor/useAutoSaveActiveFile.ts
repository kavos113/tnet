import { useEffect } from 'react';
import { useAppSelector } from '@tnet/app-markdown/renderer/storeHooks';
import type { EditorGroupId } from './editorSlice';

interface UseAutoSaveActiveFileOptions {
  canSave: boolean;
  saveActiveFile: () => Promise<void>;
  groupId?: EditorGroupId;
}

export const useAutoSaveActiveFile = ({
  canSave,
  saveActiveFile,
  groupId
}: UseAutoSaveActiveFileOptions): void => {
  const activeFile = useAppSelector((state) => {
    const targetGroupId = groupId ?? state.editor.activeGroupId;
    const group = state.editor.groups[targetGroupId];
    const activePath =
      group.activeIndex >= 0 && group.activeIndex < group.tabs.length
        ? group.tabs[group.activeIndex]
        : null;
    return activePath ? state.editor.filesByPath[activePath] : null;
  });
  const { autoSaveDebounceMs, autoSaveEnabled } = useAppSelector(
    (state) => state.workspace.settings.markdown
  );

  useEffect(() => {
    if (!autoSaveEnabled || !canSave || !activeFile?.isModified) return;

    const timeoutId = window.setTimeout(
      () => {
        saveActiveFile().catch((error: unknown) => {
          console.error('Failed to auto-save file', error);
        });
      },
      Math.max(0, autoSaveDebounceMs)
    );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    activeFile?.content,
    activeFile?.isModified,
    activeFile?.path,
    autoSaveDebounceMs,
    autoSaveEnabled,
    canSave,
    saveActiveFile
  ]);
};
