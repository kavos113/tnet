CREATE TABLE IF NOT EXISTS requester_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  settings_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS requests (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  request_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  request_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE (workspace_id, request_path)
);

CREATE TABLE IF NOT EXISTS variable_sets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  variables_json TEXT NOT NULL,
  secret_refs_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history_entries (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  request_id TEXT,
  request_name TEXT NOT NULL,
  request_type TEXT NOT NULL,
  method TEXT NOT NULL,
  url TEXT NOT NULL,
  executed_url TEXT NOT NULL,
  started_at TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  status INTEGER,
  status_text TEXT NOT NULL,
  request_body_mode TEXT NOT NULL,
  request_content_type TEXT NOT NULL,
  request_body_text TEXT NOT NULL,
  request_body_base64 TEXT NOT NULL,
  request_byte_size INTEGER NOT NULL,
  request_is_body_truncated INTEGER NOT NULL,
  request_preview_type TEXT NOT NULL,
  response_content_type TEXT NOT NULL,
  response_body_text TEXT NOT NULL,
  response_body_base64 TEXT NOT NULL,
  response_byte_size INTEGER NOT NULL,
  response_is_body_truncated INTEGER NOT NULL,
  response_preview_type TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS history_request_headers (
  id TEXT PRIMARY KEY,
  history_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  header_key TEXT NOT NULL,
  header_value TEXT NOT NULL,
  FOREIGN KEY (history_id) REFERENCES history_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS history_response_headers (
  id TEXT PRIMARY KEY,
  history_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  header_key TEXT NOT NULL,
  header_value TEXT NOT NULL,
  FOREIGN KEY (history_id) REFERENCES history_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cookies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  domain TEXT NOT NULL,
  path TEXT NOT NULL,
  expires_at TEXT,
  secure INTEGER NOT NULL,
  http_only INTEGER NOT NULL,
  same_site TEXT,
  host_only INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  UNIQUE (workspace_id, name, domain, path)
);

CREATE TABLE IF NOT EXISTS response_blobs (
  id TEXT PRIMARY KEY,
  history_id TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  relative_path TEXT NOT NULL,
  FOREIGN KEY (history_id) REFERENCES history_entries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS graphql_schemas (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  endpoint_hash TEXT NOT NULL,
  variable_set_id TEXT,
  schema_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (variable_set_id) REFERENCES variable_sets(id) ON DELETE SET NULL
);

INSERT OR IGNORE INTO requester_schema_migrations (version, applied_at)
VALUES (1, datetime('now'));

INSERT OR IGNORE INTO requester_schema_migrations (version, applied_at)
VALUES (2, datetime('now'));
