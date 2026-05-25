-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE plan_type AS ENUM ('free', 'pro', 'business');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing', 'inactive');

CREATE TABLE public.subscriptions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan                    plan_type NOT NULL DEFAULT 'free',
  status                  subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

CREATE TABLE public.links (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug            TEXT NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  title           TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_links_slug ON public.links(slug);
CREATE INDEX idx_links_user_id ON public.links(user_id);
CREATE INDEX idx_links_is_active ON public.links(is_active);

CREATE TYPE device_type AS ENUM ('mobile', 'desktop', 'tablet', 'unknown');

CREATE TABLE public.clicks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id     UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_hash     TEXT,
  country     CHAR(2),
  device      device_type DEFAULT 'unknown',
  browser     TEXT,
  os          TEXT,
  referrer    TEXT,
  user_agent  TEXT,
  is_unique   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_clicks_link_id ON public.clicks(link_id);
CREATE INDEX idx_clicks_timestamp ON public.clicks(timestamp);
CREATE INDEX idx_clicks_country ON public.clicks(country);
CREATE INDEX idx_clicks_device ON public.clicks(device);
CREATE INDEX idx_clicks_is_unique ON public.clicks(is_unique);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "links_select_own" ON public.links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "links_insert_own" ON public.links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "links_update_own" ON public.links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "links_delete_own" ON public.links FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "clicks_select_own" ON public.clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.links
      WHERE links.id = clicks.link_id
      AND links.user_id = auth.uid()
    )
  );

CREATE POLICY "clicks_insert_service" ON public.clicks FOR INSERT WITH CHECK (TRUE);

CREATE OR REPLACE VIEW public.link_click_summary AS
SELECT
  l.id AS link_id,
  l.slug,
  l.destination_url,
  l.user_id,
  l.created_at,
  l.is_active,
  COUNT(c.id) AS total_clicks,
  COUNT(c.id) FILTER (WHERE c.is_unique = TRUE) AS unique_clicks,
  MAX(c.timestamp) AS last_clicked_at
FROM public.links l
LEFT JOIN public.clicks c ON c.link_id = l.id
GROUP BY l.id;

CREATE OR REPLACE VIEW public.daily_clicks AS
SELECT
  link_id,
  DATE_TRUNC('day', timestamp) AS click_date,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_unique = TRUE) AS unique_total
FROM public.clicks
GROUP BY link_id, click_date
ORDER BY click_date;

CREATE OR REPLACE FUNCTION public.get_user_link_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.links
  WHERE user_id = p_user_id AND is_active = TRUE;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_plan(p_user_id UUID)
RETURNS plan_type AS $$
  SELECT plan
  FROM public.subscriptions
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;
