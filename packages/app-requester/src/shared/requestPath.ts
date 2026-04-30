export interface RequesterExplorerNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: RequesterExplorerNode[];
}

export const normalizeRequestPath = (nameOrPath: string): string => {
  const normalized = nameOrPath
    .trim()
    .replaceAll('\\', '/')
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .join('/');

  if (!normalized) return 'untitled.req';
  return normalized.endsWith('.req') ? normalized : `${normalized}.req`;
};

export const requestNameFromPath = (requestPath: string): string => {
  const filename = normalizeRequestPath(requestPath).split('/').at(-1) ?? 'untitled.req';
  return filename.endsWith('.req') ? filename.slice(0, -4) : filename;
};

export const buildRequesterExplorerTree = (
  requests: { name: string; requestPath: string }[]
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
          name: isLeaf ? request.name : part,
          path: currentPath,
          isDirectory: !isLeaf,
          children: isLeaf ? undefined : []
        };
        siblings.push(node);
      }
      siblings = node.children ?? [];
    });
  }

  return root.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
};
