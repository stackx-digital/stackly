-- Link health monitoring
ALTER TABLE public.links
  ADD COLUMN IF NOT EXISTS health_status TEXT NOT NULL DEFAULT 'unknown'
    CHECK (health_status IN ('unknown', 'healthy', 'down', 'redirected')),
  ADD COLUMN IF NOT EXISTS health_http_status INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_health_check_at TIMESTAMPTZ DEFAULT NULL;

-- History of health events (status changes only)
CREATE TABLE IF NOT EXISTS public.link_health_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'down', 'redirected')),
  http_status INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS link_health_events_link_id_idx ON public.link_health_events(link_id);
CREATE INDEX IF NOT EXISTS link_health_events_checked_at_idx ON public.link_health_events(checked_at DESC);

-- RLS
ALTER TABLE public.link_health_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own link health events"
  ON public.link_health_events FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.links WHERE user_id = auth.uid()
    )
  );
