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

export const toWorkspaceAbsolutePath = (rootDir: string, filePath: string): string => {
  if (!rootDir || !filePath) return filePath;
  const normalizedPath = normalizeToSlash(filePath);
  if (/^[a-zA-Z]:\//.test(normalizedPath) || normalizedPath.startsWith('/')) return filePath;
  return joinPath(rootDir, filePath);
};

export const dirname = (filePath: string): string => {
  const separator = filePath.includes('\\') ? '\\' : '/';
  const index = Math.max(filePath.lastIndexOf('\\'), filePath.lastIndexOf('/'));
  return index === -1 ? '' : filePath.slice(0, index).replace(/[\\/]$/, '') || separator;
};

export const joinPath = (parent: string, child: string): string => {
  const separator = parent.includes('\\') ? '\\' : '/';
  return parent.endsWith(separator) ? `${parent}${child}` : `${parent}${separator}${child}`;
};
