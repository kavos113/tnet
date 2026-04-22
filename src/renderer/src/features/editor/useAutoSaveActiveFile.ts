import { useEffect } from 'react';
import { useAppSelector } from '@renderer/app/hooks';

interface UseAutoSaveActiveFileOptions {
  canSave: boolean;
  saveActiveFile: () => Promise<void>;
}

export const useAutoSaveActiveFile = ({
  canSave,
  saveActiveFile
}: UseAutoSaveActiveFileOptions): void => {
  const { openedFiles, activeIndex } = useAppSelector((state) => state.editor);
  const { autoSaveDebounceMs, autoSaveEnabled } = useAppSelector(
    (state) => state.workspace.settings
  );
  const activeFile = activeIndex >= 0 ? openedFiles[activeIndex] : null;

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
