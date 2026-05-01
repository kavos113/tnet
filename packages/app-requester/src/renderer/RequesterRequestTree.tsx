import type { RequesterExplorerNode } from '@tnet/app-requester/shared/requestPath';

interface RequesterRequestTreeProps {
  activeFolderPath?: string;
  activeRequestId?: string;
  expandedPaths: string[];
  nodes: RequesterExplorerNode[];
  onSelectFolder: (folderPath: string) => void;
  onSelectRequest: (requestId: string) => void;
  onToggleFolder: (folderPath: string) => void;
}

interface RequesterRequestTreeItemProps extends Omit<RequesterRequestTreeProps, 'nodes'> {
  node: RequesterExplorerNode;
}

const RequesterRequestTreeItem = ({
  activeFolderPath,
  activeRequestId,
  expandedPaths,
  node,
  onSelectFolder,
  onSelectRequest,
  onToggleFolder
}: RequesterRequestTreeItemProps): React.JSX.Element => {
  const isExpanded = expandedPaths.includes(node.path);
  const isSelected = node.isDirectory
    ? activeFolderPath === node.path && !activeRequestId
    : activeRequestId === node.requestId;

  const activate = (): void => {
    if (node.isDirectory) {
      onSelectFolder(node.path);
      return;
    }
    if (node.requestId) onSelectRequest(node.requestId);
  };

  return (
    <li>
      <div
        className={`file-tree-item ${isSelected ? 'file-item-is-selected' : ''}`}
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          activate();
        }}
      >
        {node.isDirectory ? (
          <>
            <button
              type="button"
              className={`material-icons-round file-item-chevron ${
                isExpanded ? 'file-item-chevron-expand' : ''
              }`}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFolder(node.path);
              }}
            >
              chevron_right
            </button>
            <span className="material-icons file-item-folder">
              {isExpanded ? 'folder_open' : 'folder'}
            </span>
          </>
        ) : (
          <span className="requester-method-label">{node.method ?? ''}</span>
        )}
        <p className={`file-item-name ${node.isDirectory ? '' : 'file-item-not-directory'}`}>
          {node.name}
        </p>
      </div>
      {node.isDirectory && node.children && isExpanded ? (
        <ul className="file-item-children">
          {node.children.map((child) => (
            <RequesterRequestTreeItem
              key={child.path}
              activeFolderPath={activeFolderPath}
              activeRequestId={activeRequestId}
              expandedPaths={expandedPaths}
              node={child}
              onSelectFolder={onSelectFolder}
              onSelectRequest={onSelectRequest}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
};

export const RequesterRequestTree = ({
  nodes,
  ...itemProps
}: RequesterRequestTreeProps): React.JSX.Element => (
  <>
    {nodes.map((node) => (
      <RequesterRequestTreeItem key={node.path} node={node} {...itemProps} />
    ))}
  </>
);
