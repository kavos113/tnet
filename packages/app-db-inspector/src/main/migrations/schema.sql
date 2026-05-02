CREATE TABLE IF NOT EXISTS db_inspector_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  driver TEXT NOT NULL,
  connection_json TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS query_tabs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  sql_text TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS query_history (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  sql_text TEXT NOT NULL,
  started_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  row_count INTEGER NOT NULL,
  error_code TEXT,
  error_message TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS saved_queries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sql_text TEXT NOT NULL,
  folder_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS schema_cache (
  workspace_id TEXT PRIMARY KEY,
  schema_json TEXT NOT NULL,
  refreshed_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO db_inspector_schema_migrations (version, applied_at)
VALUES (1, datetime('now'));
