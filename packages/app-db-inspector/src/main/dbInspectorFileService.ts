import path from 'path';
import { dialog } from 'electron';

export const selectSqliteDatabaseFile = async (): Promise<{
  path: string;
  name: string;
} | null> => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'SQLite Database', extensions: ['db', 'sqlite', 'sqlite3'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  const filePath = result.filePaths[0];
  return result.canceled || !filePath ? null : { path: filePath, name: path.basename(filePath) };
};
