import type { RequesterExplorerNode } from '@tnet/app-requester/shared/requestPath';
import styles from './RequesterRequestTree.module.css';
import treeStyles from './RequesterTree.module.css';

interface RequesterRequestTreeProps {
  activeFolderPath?: string;
  activeRequestId?: string;
  expandedPaths: string[];
  newFolder: {
    isActive: boolean;
    parentPath?: string;
    name: string;
  };
  nodes: RequesterExplorerNode[];
  onCancelNewFolder: () => void;
  onConfirmNewFolder: () => Promise<void>;
  onNewFolderNameChange: (name: string) => void;
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
  onToggleFolder,
  ...itemProps
}: RequesterRequestTreeItemProps): React.JSX.Element => {
  const isExpanded = expandedPaths.includes(node.path);
  const isSelected = node.isDirectory
    ? activeFolderPath === node.path && !activeRequestId
    : activeRequestId === node.requestId;
  const shouldShowNewFolderHere =
    itemProps.newFolder.isActive && itemProps.newFolder.parentPath === node.path;

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
        className={`${treeStyles.treeItem} ${isSelected ? treeStyles.selected : ''}`}
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
              className={`material-symbols-rounded ${treeStyles.chevron} ${
                isExpanded ? treeStyles.chevronExpanded : ''
              }`}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFolder(node.path);
              }}
            >
              chevron_right
            </button>
            <span className={`material-symbols-rounded ${treeStyles.folder}`}>
              {isExpanded ? 'folder_open' : 'folder'}
            </span>
          </>
        ) : (
          <span className={styles.methodLabel}>{node.method ?? ''}</span>
        )}
        <p className={`${treeStyles.name} ${node.isDirectory ? '' : treeStyles.fileName}`}>
          {node.name}
        </p>
      </div>
      {node.isDirectory && node.children && isExpanded ? (
        <ul className={treeStyles.children}>
          {shouldShowNewFolderHere ? (
            <li className={treeStyles.newItem}>
              <div className={treeStyles.treeItem}>
                <span
                  className={`material-symbols-rounded ${treeStyles.chevron} ${treeStyles.iconPlaceholder}`}
                >
                  chevron_right
                </span>
                <span className={`material-symbols-rounded ${treeStyles.folder}`}>folder</span>
                <input
                  className={treeStyles.newInput}
                  value={itemProps.newFolder.name}
                  onChange={(event) => itemProps.onNewFolderNameChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      itemProps.onConfirmNewFolder().catch((error: unknown) => {
                        console.error('Failed to create requester folder', error);
                      });
                    } else if (event.key === 'Escape') {
                      event.preventDefault();
                      itemProps.onCancelNewFolder();
                    }
                  }}
                  onBlur={itemProps.onCancelNewFolder}
                  autoFocus
                />
              </div>
            </li>
          ) : null}
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
              {...itemProps}
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
