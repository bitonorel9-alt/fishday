-- כל שורה היא אירוע אחד. אין כאן שם, מיקום או כתובת IP.
CREATE TABLE IF NOT EXISTS events (
  ts INTEGER NOT NULL,
  day TEXT NOT NULL,
  hour INTEGER NOT NULL,
  device TEXT NOT NULL,
  session TEXT NOT NULL,
  name TEXT NOT NULL,
  page TEXT,
  num REAL,
  app INTEGER NOT NULL DEFAULT 0,
  msg TEXT
);
CREATE INDEX IF NOT EXISTS events_day ON events (day);
CREATE INDEX IF NOT EXISTS events_name_day ON events (name, day);

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
CREATE TABLE IF NOT EXISTS members (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  updates INTEGER NOT NULL DEFAULT 0,
  device TEXT NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS members_created ON members (created);
