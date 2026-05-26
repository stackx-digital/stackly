CREATE TABLE IF NOT EXISTS public.custom_domains (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  domain             TEXT NOT NULL UNIQUE,
  verification_token TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'pending', -- pending | active | failed
  verified_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own custom domains" ON public.custom_domains
  FOR ALL USING (auth.uid() = user_id);
