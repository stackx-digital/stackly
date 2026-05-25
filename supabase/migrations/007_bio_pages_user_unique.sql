-- Fix: add unique constraint on user_id so upsert ON CONFLICT works
ALTER TABLE public.bio_pages ADD CONSTRAINT bio_pages_user_id_key UNIQUE (user_id);
