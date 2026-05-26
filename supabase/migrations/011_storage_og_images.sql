-- Create public bucket for OG preview images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images',
  'og-images',
  true,
  5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload into their own folder (user_id/filename)
CREATE POLICY "Users upload own og images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'og-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Authenticated users can delete their own images
CREATE POLICY "Users delete own og images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'og-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access (images need to be publicly accessible for OG crawlers)
CREATE POLICY "Public read og images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'og-images');
