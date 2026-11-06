-- דיווחים ממשתמשים, ושדה להודעת שגיאה באירועים.
CREATE TABLE IF NOT EXISTS feedback (
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  device TEXT NOT NULL,
  kind TEXT NOT NULL,
  page TEXT,
  text TEXT NOT NULL,
  contact TEXT
);
CREATE INDEX IF NOT EXISTS feedback_ts ON feedback (ts);
ALTER TABLE events ADD COLUMN msg TEXT;
