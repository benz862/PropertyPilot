-- Property DNA version tracking for rebuild + asset staleness

ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS dna_version INTEGER NOT NULL DEFAULT 1;
