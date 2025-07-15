-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chadabaz-media', 'chadabaz-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chadabaz-media bucket
CREATE POLICY "Public can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can update media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can delete media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chadabaz-media');
