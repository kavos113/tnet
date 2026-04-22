import { useEffect } from 'react';
import { useAppSelector } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';

interface UsePersistSessionOptions {
  enabled: boolean;
  debounceMs?: number;
}

export const usePersistSession = ({
  enabled,
  debounceMs = 150
}: UsePersistSessionOptions): void => {
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const openedFiles = useAppSelector((state) => state.editor.openedFiles);
  const expandedPaths = useAppSelector((state) => state.explorer.expandedPaths);

  useEffect(() => {
    if (!enabled || !rootPath) return;

    const timeoutId = window.setTimeout(() => {
      tnetApi.session
        .save(rootPath, {
          openedFiles: openedFiles.map((file) => file.path),
          expandedFolders: expandedPaths
        })
        .catch((error: unknown) => {
          console.error('Failed to save session', error);
        });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, enabled, expandedPaths, openedFiles, rootPath]);
};
