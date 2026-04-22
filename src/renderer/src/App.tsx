import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@renderer/app/hooks';
import { tnetApi } from '@renderer/lib/tnetApi';
import { openFile } from '@renderer/features/editor/editorSlice';
import { EditorWorkspace } from '@renderer/features/editor/EditorWorkspace';
import { ExplorerPanel } from '@renderer/features/explorer/ExplorerPanel';
import { setExpandedPaths } from '@renderer/features/explorer/explorerSlice';
import { SettingsDialog } from '@renderer/features/settings/SettingsDialog';
import { setSettings, setWorkspace } from '@renderer/features/workspace/workspaceSlice';

export const App = (): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const rootPath = useAppSelector((state) => state.workspace.rootPath);
  const openedFiles = useAppSelector((state) => state.editor.openedFiles);
  const expandedPaths = useAppSelector((state) => state.explorer.expandedPaths);

  useEffect(() => {
    const restoreWorkspace = async (): Promise<void> => {
      const config = await tnetApi.config.loadGlobal();
      if (!config.lastOpenedDirectory) return;

      const fileTree = await tnetApi.workspace.getFileTree(config.lastOpenedDirectory);
      dispatch(setWorkspace({ rootPath: config.lastOpenedDirectory, fileTree }));
      dispatch(setSettings(await tnetApi.config.loadProject(config.lastOpenedDirectory)));

      const session = await tnetApi.session.load(config.lastOpenedDirectory);
      dispatch(setExpandedPaths(session.expandedFolders));
      for (const filePath of session.openedFiles) {
        const content = await tnetApi.file.read(filePath);
        dispatch(openFile({ path: filePath, content }));
      }
    };

    restoreWorkspace().catch((error: unknown) => {
      console.error('Failed to restore workspace', error);
    });
  }, [dispatch]);

  useEffect(() => {
    if (!rootPath) return;

    tnetApi.session
      .save(rootPath, {
        openedFiles: openedFiles.map((file) => file.path),
        expandedFolders: expandedPaths
      })
      .catch((error: unknown) => {
        console.error('Failed to save session', error);
      });
  }, [rootPath, openedFiles, expandedPaths]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault();
        setIsSettingsOpen(true);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="app-shell">
      <ExplorerPanel />
      <EditorWorkspace />
      <SettingsDialog isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
