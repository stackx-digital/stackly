ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS active_from      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS password_hash    TEXT,
  ADD COLUMN IF NOT EXISTS redirect_mobile  TEXT,
  ADD COLUMN IF NOT EXISTS redirect_tablet  TEXT,
  ADD COLUMN IF NOT EXISTS geo_rules        JSONB DEFAULT '[]'::jsonb;
