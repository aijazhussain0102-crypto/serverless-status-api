CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('operational', 'degraded', 'outage')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

INSERT INTO services (id, name, status) VALUES
  ('dashboard', 'Customer Dashboard', 'operational'),
  ('payments', 'Payments API', 'degraded'),
  ('support', 'Support Portal', 'operational');
