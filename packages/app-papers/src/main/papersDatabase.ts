import fs from 'fs';
import Database from 'better-sqlite3';
import schemaSql from './schema.sql?raw';
import { papersDataDir, papersDatabasePath } from './papersPaths';

export type PapersDatabase = Database.Database;

export const readPapersSchemaSql = async (): Promise<string> => schemaSql;

export const openPapersDatabase = async (libraryRoot: string): Promise<PapersDatabase> => {
  if (!libraryRoot) throw new Error('libraryRoot is required');

  fs.mkdirSync(papersDataDir(libraryRoot), { recursive: true });
  const database = new Database(papersDatabasePath(libraryRoot));
  database.pragma('foreign_keys = ON');
  database.exec(await readPapersSchemaSql());
  return database;
};
