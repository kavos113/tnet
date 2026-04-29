PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS papers_schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  abstract TEXT,
  published_year INTEGER,
  venue TEXT,
  doi TEXT,
  arxiv_id TEXT,
  url TEXT,
  pdf_path TEXT,
  directory_path TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS paper_authors (
  id TEXT PRIMARY KEY,
  paper_id TEXT NOT NULL,
  name TEXT NOT NULL,
  position INTEGER NOT NULL,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

CREATE TABLE IF NOT EXISTS paper_tags (
  paper_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  PRIMARY KEY (paper_id, tag_id),
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  paper_id TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE
);

CREATE VIRTUAL TABLE IF NOT EXISTS paper_search USING fts5(
  paper_id UNINDEXED,
  title,
  authors,
  abstract,
  note,
  content='',
  tokenize='unicode61'
);

INSERT OR IGNORE INTO papers_schema_migrations (version, applied_at)
VALUES (1, datetime('now'));
