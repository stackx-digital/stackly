CREATE TABLE IF NOT EXISTS public.bio_pages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  username    TEXT NOT NULL UNIQUE,
  title       TEXT,
  description TEXT,
  theme       TEXT NOT NULL DEFAULT 'violet',
  avatar_url  TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{3,30}$')
);

CREATE TABLE IF NOT EXISTS public.bio_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own bio page" ON public.bio_pages
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own bio links" ON public.bio_links
  FOR ALL USING (
    bio_page_id IN (SELECT id FROM public.bio_pages WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view published bio pages" ON public.bio_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view bio links of published pages" ON public.bio_links
  FOR SELECT USING (
    bio_page_id IN (SELECT id FROM public.bio_pages WHERE is_published = true)
  );
