import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { tasksDatabasePath } from '../tasksPaths';

const schemaSql = `
CREATE TABLE IF NOT EXISTS tasks_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT NOT NULL,
  deadline_date TEXT,
  deadline_time TEXT,
  category TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_deadline_date ON tasks(deadline_date);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_completed_at ON tasks(completed_at);

CREATE TABLE IF NOT EXISTS calendar_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  uri TEXT NOT NULL,
  color TEXT,
  enabled INTEGER NOT NULL,
  last_synced_at TEXT,
  last_sync_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_event_occurrences (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  all_day INTEGER NOT NULL,
  description TEXT,
  location TEXT,
  recurrence_id TEXT,
  last_modified TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES calendar_sources(id) ON DELETE CASCADE,
  UNIQUE (source_id, uid, starts_at, recurrence_id)
);

CREATE INDEX IF NOT EXISTS idx_calendar_event_occurrences_range
  ON calendar_event_occurrences(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_calendar_event_occurrences_source
  ON calendar_event_occurrences(source_id);

INSERT OR IGNORE INTO tasks_schema_migrations (version, applied_at)
VALUES (1, datetime('now'));
`;

export type TasksDatabase = Database.Database;

export const openTasksDatabase = (userDataDir: string): TasksDatabase => {
  const databasePath = tasksDatabasePath(userDataDir);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma('foreign_keys = ON');
  database.pragma('journal_mode = WAL');
  database.pragma('busy_timeout = 5000');
  database.exec(schemaSql);
  return database;
};
