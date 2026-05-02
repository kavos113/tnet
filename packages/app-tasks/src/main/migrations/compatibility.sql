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
