export interface RequesterExplorerNode {
  name: string;
  path: string;
  isDirectory: boolean;
  requestId?: string;
  method?: string;
  children?: RequesterExplorerNode[];
}

export const requesterRequestExtension = '.http';
const legacyRequesterRequestExtensions = ['.req'];
const requestExtensions = [requesterRequestExtension, ...legacyRequesterRequestExtensions];

const stripRequestExtension = (path: string): string => {
  const extension = requestExtensions.find((extension) => path.endsWith(extension));
  return extension ? path.slice(0, -extension.length) : path;
};

export const normalizeRequestPath = (nameOrPath: string): string => {
  const normalized = nameOrPath
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');

  if (!normalized) return `untitled${requesterRequestExtension}`;
  return `${stripRequestExtension(normalized)}${requesterRequestExtension}`;
};

export const requestNameFromPath = (requestPath: string): string => {
  const filename =
    normalizeRequestPath(requestPath).split('/').at(-1) ?? `untitled${requesterRequestExtension}`;
  return stripRequestExtension(filename);
};

export const requestFolderFromPath = (requestPath: string): string | undefined => {
  const parts = normalizeRequestPath(requestPath).split('/');
  parts.pop();
  return parts.length > 0 ? parts.join('/') : undefined;
};

export const requestDisplayNameFromPath = (requestPath: string): string => {
  const filename =
    normalizeRequestPath(requestPath).split('/').at(-1) ?? `untitled${requesterRequestExtension}`;
  return filename;
};

export const buildRequesterExplorerTree = (
  requests: { id?: string; name: string; method?: string; requestPath: string }[]
): RequesterExplorerNode[] => {
  const root: RequesterExplorerNode[] = [];

  for (const request of requests) {
    const parts = normalizeRequestPath(request.requestPath).split('/');
    let siblings = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = index === parts.length - 1;
      let node = siblings.find((item) => item.name === part && item.isDirectory !== isLeaf);
      if (!node) {
        node = {
          name: isLeaf ? requestDisplayNameFromPath(part) : part,
          path: currentPath,
          isDirectory: !isLeaf,
          requestId: isLeaf ? request.id : undefined,
          method: isLeaf ? request.method : undefined,
          children: isLeaf ? undefined : []
        };
        siblings.push(node);
      } else if (isLeaf) {
        node.requestId = request.id;
        node.method = request.method;
      }
      siblings = node.children ?? [];
    });
  }

  const sortNodes = (nodes: RequesterExplorerNode[]): RequesterExplorerNode[] =>
    nodes.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

  const sortRecursively = (nodes: RequesterExplorerNode[]): RequesterExplorerNode[] => {
    for (const node of nodes) {
      if (node.children) sortRecursively(node.children);
    }
    return sortNodes(nodes);
  };

  return sortRecursively(root);
};
