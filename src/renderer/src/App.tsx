import { useEffect } from 'react';
import { tnetApi } from '@renderer/lib/tnetApi';
import { ExplorerPanel } from '@renderer/features/explorer/ExplorerPanel';
import { EditorWorkspace } from '@renderer/features/editor/EditorWorkspace';
import { useWorkspaceStore } from '@renderer/features/workspace/workspaceStore';

export const App = (): React.JSX.Element => {
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  useEffect(() => {
    const restoreWorkspace = async (): Promise<void> => {
      const config = await tnetApi.config.loadGlobal();
      if (!config.lastOpenedDirectory) return;

      const fileTree = await tnetApi.workspace.getFileTree(config.lastOpenedDirectory);
      setWorkspace(config.lastOpenedDirectory, fileTree);
    };

    restoreWorkspace().catch((error: unknown) => {
      console.error('Failed to restore workspace', error);
    });
  }, [setWorkspace]);

  return (
    <div className="app-shell">
      <ExplorerPanel />
      <EditorWorkspace />
    </div>
  );
};
