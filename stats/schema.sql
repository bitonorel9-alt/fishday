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
  app INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS events_day ON events (day);
CREATE INDEX IF NOT EXISTS events_name_day ON events (name, day);
