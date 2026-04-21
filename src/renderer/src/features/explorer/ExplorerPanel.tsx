import { tnetApi } from '@renderer/lib/tnetApi';
import { useWorkspaceStore } from '@renderer/features/workspace/workspaceStore';
import { FileTree } from './FileTree';

export const ExplorerPanel = (): React.JSX.Element => {
  const rootPath = useWorkspaceStore((state) => state.rootPath);
  const fileTree = useWorkspaceStore((state) => state.fileTree);
  const setWorkspace = useWorkspaceStore((state) => state.setWorkspace);

  const openWorkspace = async (): Promise<void> => {
    const result = await tnetApi.workspace.openDirectory();
    if (!result.rootPath) return;

    setWorkspace(result.rootPath, result.fileTree);
    await tnetApi.config.saveGlobal({ lastOpenedDirectory: result.rootPath });
  };

  return (
    <aside className="explorer-panel">
      <div className="sidebar-header">
        <span className="sidebar-title">Files</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Open workspace"
          onClick={openWorkspace}
        >
          +
        </button>
      </div>
      {rootPath ? (
        <FileTree items={fileTree} />
      ) : (
        <div className="empty-workspace">
          <button type="button" className="primary-button" onClick={openWorkspace}>
            Open Folder
          </button>
        </div>
      )}
    </aside>
  );
};
