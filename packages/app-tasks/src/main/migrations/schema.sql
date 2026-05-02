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

CREATE TABLE IF NOT EXISTS subscribed_task_completion_overrides (
  source_id TEXT NOT NULL,
  uid TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  deadline_time TEXT NOT NULL DEFAULT '',
  recurrence_id TEXT NOT NULL DEFAULT '',
  completed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (source_id, uid, deadline_date, deadline_time, recurrence_id),
  FOREIGN KEY (source_id) REFERENCES calendar_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_subscribed_task_completion_completed_at
  ON subscribed_task_completion_overrides(completed_at);

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
