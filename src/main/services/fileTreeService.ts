import fs from 'fs/promises';
import path from 'path';
import type { FileItem } from '@shared/types/file';

export const getFileTree = async (dirPath: string): Promise<FileItem[]> => {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const result = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        try {
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            children: await getFileTree(fullPath)
          };
        } catch {
          return {
            name: entry.name,
            path: fullPath,
            isDirectory: true,
            children: []
          };
        }
      }

      return {
        name: entry.name,
        path: fullPath,
        isDirectory: false
      };
    })
  );

  result.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
};
