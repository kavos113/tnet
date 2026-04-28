import { useEffect } from 'react';
import { useAppSelector } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';

interface UsePersistMarkdownSessionOptions {
  enabled: boolean;
  debounceMs?: number;
}

export const usePersistMarkdownSession = ({
  enabled,
  debounceMs = 150
}: UsePersistMarkdownSessionOptions): void => {
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const editor = useAppSelector((state) => state.editor);
  const expandedPaths = useAppSelector((state) => state.explorer.expandedPaths);

  useEffect(() => {
    if (!enabled || !rootPath) return;

    const timeoutId = window.setTimeout(() => {
      const openedFiles = Array.from(
        new Set([...editor.groups.primary.tabs, ...editor.groups.secondary.tabs])
      );
      tnetApi.session
        .save(rootPath, {
          openedFiles,
          expandedFolders: expandedPaths,
          editorLayout: {
            activeGroupId: editor.activeGroupId,
            isSecondaryGroupVisible: editor.isSecondaryGroupVisible,
            groupWidthPercent: editor.groupWidthPercent,
            groups: {
              primary: {
                openedFiles: editor.groups.primary.tabs,
                activeIndex: editor.groups.primary.activeIndex,
                viewMode: editor.groups.primary.viewMode,
                isPreviewOutlineVisible: editor.groups.primary.isPreviewOutlineVisible
              },
              secondary: {
                openedFiles: editor.groups.secondary.tabs,
                activeIndex: editor.groups.secondary.activeIndex,
                viewMode: editor.groups.secondary.viewMode,
                isPreviewOutlineVisible: editor.groups.secondary.isPreviewOutlineVisible
              }
            }
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to save markdown session', error);
        });
    }, debounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [debounceMs, editor, enabled, expandedPaths, rootPath]);
};
