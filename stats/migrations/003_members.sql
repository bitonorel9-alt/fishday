-- חברים שנרשמו: שם ומייל בלבד, והסכמה לקבל עדכונים.
CREATE TABLE IF NOT EXISTS members (
  email TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  updates INTEGER NOT NULL DEFAULT 0,
  device TEXT NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS members_created ON members (created);
