-- Contains no raw events, URLs, IP addresses, user agents, search text, or records.
CREATE TABLE visitors (
  visitor TEXT PRIMARY KEY,
  first_day TEXT NOT NULL,
  last_day TEXT NOT NULL,
  flags INTEGER NOT NULL
);
CREATE TABLE visitor_days (
  day TEXT NOT NULL,
  visitor TEXT NOT NULL,
  flags INTEGER NOT NULL,
  is_returning INTEGER NOT NULL,
  events INTEGER NOT NULL,
  PRIMARY KEY (day, visitor)
) WITHOUT ROWID;
CREATE TABLE daily_stats (
  day TEXT PRIMARY KEY,
  visitors INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 0,
  is_returning INTEGER NOT NULL DEFAULT 0,
  events INTEGER NOT NULL DEFAULT 0,
  limited INTEGER NOT NULL DEFAULT 0,
  last_received_at TEXT
);
CREATE TRIGGER visitor_day_insert AFTER INSERT ON visitor_days BEGIN
  INSERT INTO daily_stats(day, visitors, active, is_returning)
    VALUES (NEW.day, 1, NEW.flags & 1, NEW.is_returning)
    ON CONFLICT(day) DO UPDATE SET visitors=visitors+1, active=active+(NEW.flags & 1), is_returning=is_returning+NEW.is_returning;
END;
CREATE TRIGGER visitor_day_update AFTER UPDATE ON visitor_days BEGIN
  UPDATE daily_stats SET active=active+((NEW.flags & 1)-(OLD.flags & 1)) WHERE day=NEW.day;
END;
CREATE TABLE counters (
  day TEXT NOT NULL,
  name TEXT NOT NULL,
  page TEXT NOT NULL,
  board TEXT NOT NULL,
  dimension TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY(day, name, page, board, dimension)
) WITHOUT ROWID;
-- Replay protection only, not an event history. Deleted after seven days.
CREATE TABLE receipts (id TEXT PRIMARY KEY, day TEXT NOT NULL, nonce TEXT NOT NULL);
CREATE INDEX receipts_day ON receipts(day);
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO metadata(key,value) VALUES ('visitor_count','0');
CREATE TRIGGER count_visitor AFTER INSERT ON visitors BEGIN
  UPDATE metadata SET value=CAST(value AS INTEGER)+1 WHERE key='visitor_count';
END;
