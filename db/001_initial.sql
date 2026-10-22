BEGIN;
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY, name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS page_pairs (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pair_key text NOT NULL, name text NOT NULL, en_url text NOT NULL, ar_url text NOT NULL,
  UNIQUE(project_id, pair_key), CHECK (en_url <> ar_url)
);
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY, project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, finished_at timestamptz,
  error text, report jsonb, CHECK (status <> 'completed' OR report IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS scans_queue_idx ON scans(created_at) WHERE status='queued';
CREATE INDEX IF NOT EXISTS scans_project_idx ON scans(project_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS scans_one_active_per_project ON scans(project_id) WHERE status IN ('queued','running');
CREATE TABLE IF NOT EXISTS page_results (
  id uuid PRIMARY KEY, scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  pair_key text NOT NULL, locale text NOT NULL CHECK (locale IN ('en','ar')),
  viewport text NOT NULL CHECK (viewport IN ('desktop','mobile')), evidence jsonb NOT NULL,
  UNIQUE(scan_id,pair_key,locale,viewport)
);
CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY, scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  fingerprint text NOT NULL, severity text NOT NULL CHECK (severity IN ('critical','warning')),
  check_id text NOT NULL, details jsonb NOT NULL, UNIQUE(scan_id,fingerprint)
);
COMMIT;
