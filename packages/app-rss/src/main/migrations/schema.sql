CREATE TABLE IF NOT EXISTS rss_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rss_folders (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (parent_id) REFERENCES rss_folders(id) ON DELETE CASCADE,
  UNIQUE (parent_id, name)
);

CREATE TABLE IF NOT EXISTS rss_feeds (
  id TEXT PRIMARY KEY,
  folder_id TEXT,
  title TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  site_url TEXT,
  description TEXT,
  icon_url TEXT,
  sort_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL,
  last_synced_at TEXT,
  last_sync_error TEXT,
  etag TEXT,
  last_modified TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (folder_id) REFERENCES rss_folders(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rss_items (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  author TEXT,
  summary TEXT,
  content_html TEXT,
  published_at TEXT,
  updated_at TEXT,
  read_at TEXT,
  starred INTEGER NOT NULL,
  archived_at TEXT,
  fetched_at TEXT NOT NULL,
  FOREIGN KEY (feed_id) REFERENCES rss_feeds(id) ON DELETE CASCADE,
  UNIQUE (feed_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_rss_items_feed_published
  ON rss_items(feed_id, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_rss_items_unread
  ON rss_items(read_at, published_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_rss_items_starred
  ON rss_items(starred, published_at DESC)
  WHERE starred = 1;

INSERT OR IGNORE INTO rss_schema_migrations (version, applied_at)
VALUES (1, datetime('now'));
