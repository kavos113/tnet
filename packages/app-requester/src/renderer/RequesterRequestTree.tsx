import type { RequesterExplorerNode } from '@tnet/app-requester/shared/requestPath';
import controlStyles from './RequesterControls.module.css';
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
  onStartRenameRequest: (requestId: string) => void;
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
  onStartRenameRequest,
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
              className={`material-icons-round ${treeStyles.chevron} ${
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
            <span className={`material-icons ${treeStyles.folder}`}>
              {isExpanded ? 'folder_open' : 'folder'}
            </span>
          </>
        ) : (
          <span className={styles.methodLabel}>{node.method ?? ''}</span>
        )}
        <p className={`${treeStyles.name} ${node.isDirectory ? '' : treeStyles.fileName}`}>
          {node.name}
        </p>
        {!node.isDirectory && node.requestId ? (
          <button
            type="button"
            className={`${controlStyles.iconButton} material-icons-round ${styles.treeAction}`}
            aria-label={`Rename ${node.name}`}
            title="Rename or move request"
            onClick={(event) => {
              event.stopPropagation();
              onStartRenameRequest(node.requestId ?? '');
            }}
          >
            edit
          </button>
        ) : null}
      </div>
      {node.isDirectory && node.children && isExpanded ? (
        <ul className={treeStyles.children}>
          {shouldShowNewFolderHere ? (
            <li className={treeStyles.newItem}>
              <div className={treeStyles.treeItem}>
                <span
                  className={`material-icons-round ${treeStyles.chevron} ${treeStyles.iconPlaceholder}`}
                >
                  chevron_right
                </span>
                <span className={`material-icons ${treeStyles.folder}`}>folder</span>
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
              onStartRenameRequest={onStartRenameRequest}
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
