-- Durable aggregate history only, no additional browser identities.
CREATE TABLE IF NOT EXISTS monthly_reports (
  month TEXT PRIMARY KEY,
  visitors INTEGER NOT NULL,
  active INTEGER NOT NULL,
  applied INTEGER NOT NULL,
  clicks INTEGER NOT NULL,
  limited INTEGER NOT NULL
);
