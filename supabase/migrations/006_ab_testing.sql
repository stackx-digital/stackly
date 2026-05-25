-- A/B Split Testing
ALTER TABLE links ADD COLUMN IF NOT EXISTS ab_variants JSONB DEFAULT '[]';
-- ab_variants format: [{"label":"A","url":"https://...","weight":50}, {"label":"B","url":"https://...","weight":50}]

-- Track which variant was served for each click
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS ab_variant TEXT DEFAULT NULL;
