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
  reminder_minutes_before INTEGER,
  recurrence_rule TEXT,
  linked_entity_id TEXT,
  source_url TEXT,
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
  item_kind TEXT NOT NULL DEFAULT 'event',
  purpose TEXT NOT NULL DEFAULT 'calendar',
  uri TEXT NOT NULL,
  color TEXT,
  enabled INTEGER NOT NULL,
  write_back_enabled INTEGER NOT NULL DEFAULT 0,
  auth_type TEXT NOT NULL DEFAULT 'none',
  username TEXT,
  password_secret_id TEXT,
  google_token_secret_id TEXT,
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

CREATE TABLE IF NOT EXISTS subscribed_task_occurrences (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  title TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  deadline_time TEXT,
  all_day INTEGER NOT NULL,
  description TEXT,
  recurrence_id TEXT,
  last_modified TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES calendar_sources(id) ON DELETE CASCADE,
  UNIQUE (source_id, uid, deadline_date, deadline_time, recurrence_id)
);

CREATE INDEX IF NOT EXISTS idx_subscribed_task_occurrences_range
  ON subscribed_task_occurrences(deadline_date);
CREATE INDEX IF NOT EXISTS idx_subscribed_task_occurrences_source
  ON subscribed_task_occurrences(source_id);

CREATE TABLE IF NOT EXISTS local_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  all_day INTEGER NOT NULL,
  location TEXT,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_local_events_range
  ON local_events(starts_at, ends_at);

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
  ensureCurrentSchema(database);
  return database;
};

const ensureCurrentSchema = (database: TasksDatabase): void => {
  ensureColumn(database, 'tasks', 'reminder_minutes_before', 'reminder_minutes_before INTEGER');
  ensureColumn(database, 'tasks', 'recurrence_rule', 'recurrence_rule TEXT');
  ensureColumn(database, 'tasks', 'linked_entity_id', 'linked_entity_id TEXT');
  ensureColumn(database, 'tasks', 'source_url', 'source_url TEXT');
  ensureColumn(
    database,
    'calendar_sources',
    'item_kind',
    "item_kind TEXT NOT NULL DEFAULT 'event'"
  );
  ensureColumn(database, 'calendar_sources', 'purpose', "purpose TEXT NOT NULL DEFAULT 'calendar'");
  ensureColumn(
    database,
    'calendar_sources',
    'write_back_enabled',
    'write_back_enabled INTEGER NOT NULL DEFAULT 0'
  );
  ensureColumn(database, 'calendar_sources', 'auth_type', "auth_type TEXT NOT NULL DEFAULT 'none'");
  ensureColumn(database, 'calendar_sources', 'username', 'username TEXT');
  ensureColumn(database, 'calendar_sources', 'password_secret_id', 'password_secret_id TEXT');
  ensureColumn(
    database,
    'calendar_sources',
    'google_token_secret_id',
    'google_token_secret_id TEXT'
  );
};

const ensureColumn = (
  database: TasksDatabase,
  table: 'tasks' | 'calendar_sources',
  column: string,
  definition: string
): void => {
  const rows = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    name: string;
  }>;
  if (rows.some((row) => row.name === column)) return;
  database.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};
