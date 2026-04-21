export const basename = (filePath: string): string => {
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || filePath;
};

export const normalizeToSlash = (filePath: string): string => filePath.replace(/\\/g, '/');

export const toWorkspaceRelativePath = (rootDir: string, filePath: string): string => {
  const root = normalizeToSlash(rootDir).replace(/\/$/, '');
  const target = normalizeToSlash(filePath);
  return target.startsWith(`${root}/`) ? target.slice(root.length + 1) : target;
};
