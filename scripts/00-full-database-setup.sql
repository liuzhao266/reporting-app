-- =================================================================================================
-- WARNING: This script will drop and recreate all specified tables, functions, triggers, policies,
-- and storage buckets. Any existing data in these tables will be lost.
-- Only run this if you intend to reset your database schema and data.
-- =================================================================================================

-- Step 1: Drop existing objects in reverse order of creation to avoid dependency issues

-- Drop storage policies first, as they are on a system table (storage.objects)
DROP POLICY IF EXISTS "Public can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public can update media" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete media" ON storage.objects;

-- Drop policies on custom tables
DROP POLICY IF EXISTS "Public can view chadabaz profiles" ON chadabaz;
DROP POLICY IF EXISTS "Public can view approved reports" ON reports;
DROP POLICY IF EXISTS "Public can submit chadabaz profiles" ON chadabaz;
DROP POLICY IF EXISTS "Public can submit reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;
DROP POLICY IF EXISTS "Admins can update chadabaz" ON chadabaz;
DROP POLICY IF EXISTS "Admins can delete chadabaz" ON chadabaz;

-- Drop triggers
DROP TRIGGER IF EXISTS update_chadabaz_updated_at ON chadabaz;
DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop views
DROP VIEW IF EXISTS admin_stats;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS reports CASCADE; -- CASCADE will drop dependent objects like foreign key constraints
DROP TABLE IF EXISTS chadabaz CASCADE;

-- Drop storage bucket (if it exists)
DELETE FROM storage.buckets WHERE id = 'chadabaz-media';

-- Step 2: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create the chadabaz table with social media URLs and unique constraint
CREATE TABLE chadabaz (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  party TEXT NOT NULL,
  profile_pic_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  youtube_url TEXT,
  tiktok_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (name, location) -- Ensures unique combination of name and location
);

-- Step 4: Create the reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chadabaz_id UUID REFERENCES chadabaz(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Create indexes for better performance
CREATE INDEX idx_chadabaz_name ON chadabaz(name);
CREATE INDEX idx_chadabaz_location ON chadabaz(location);
CREATE INDEX idx_chadabaz_party ON chadabaz(party);
CREATE INDEX idx_chadabaz_created_at ON chadabaz(created_at);
CREATE INDEX idx_reports_chadabaz_id ON reports(chadabaz_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Step 6: Enable Row Level Security
ALTER TABLE chadabaz ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers for updated_at
CREATE TRIGGER update_chadabaz_updated_at 
    BEFORE UPDATE ON chadabaz 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create policies for public read and insert access
CREATE POLICY "Public can view chadabaz profiles" ON chadabaz
  FOR SELECT USING (true);

CREATE POLICY "Public can view approved reports" ON reports
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Public can submit chadabaz profiles" ON chadabaz
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can submit reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Step 10: Create admin policies for full access to data
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE USING (true);

CREATE POLICY "Admins can update chadabaz" ON chadabaz
  FOR UPDATE USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete chadabaz" ON chadabaz
  FOR DELETE USING (true);

-- Step 11: Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'approved') as approved_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_reports,
  (SELECT COUNT(*) FROM chadabaz) as total_chadabaz;

-- Grant access to the view
GRANT SELECT ON admin_stats TO anon, authenticated;

-- Step 12: Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chadabaz-media', 'chadabaz-media', true)
ON CONFLICT (id) DO NOTHING; -- Use ON CONFLICT for bucket creation

-- Step 13: Create storage policies for chadabaz-media bucket
CREATE POLICY "Public can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can update media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can delete media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chadabaz-media');

-- Step 14: Insert sample chadabaz data
DO $$
DECLARE
    karim_id UUID;
    rahim_id UUID;
    salah_id UUID;
    rafiq_id UUID;
    nasir_id UUID;
    ali_id UUID;
    kamal_id UUID;
    jahid_id UUID;
BEGIN
    -- Get chadabaz IDs
    SELECT id INTO karim_id FROM chadabaz WHERE name = 'মোহাম্মদ করিম' LIMIT 1;
    SELECT id INTO rahim_id FROM chadabaz WHERE name = 'আব্দুল রহিম' LIMIT 1;
    SELECT id INTO salah_id FROM chadabaz WHERE name = 'সালাহউদ্দিন আহমেদ' LIMIT 1;
    SELECT id INTO rafiq_id FROM chadabaz WHERE name = 'রফিকুল ইসলাম' LIMIT 1;
    SELECT id INTO nasir_id FROM chadabaz WHERE name = 'নাসির উদ্দিন' LIMIT 1;
    SELECT id INTO ali_id FROM chadabaz WHERE name = 'আলী হাসান' LIMIT 1;
    SELECT id INTO kamal_id FROM chadabaz WHERE name = 'কামাল উদ্দিন' LIMIT 1;
    SELECT id INTO jahid_id FROM chadabaz WHERE name = 'জাহিদ হোসেন' LIMIT 1;

    -- Insert reports for Mohammad Karim (5 reports - highest)
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (karim_id, 'এই ব্যক্তি আমাদের এলাকায় নিয়মিত চাঁদা দাবি করে। দোকানদারদের কাছ থেকে জোর করে টাকা নেয়। স্থানীয় যুবকদের দিয়ে ভয় দেখায়। গত মাসে আমার দোকানে এসে ৫০০০ টাকা চাঁদা দাবি করেছে।', 'approved', NOW() - INTERVAL '15 days'),
    (karim_id, 'গত সপ্তাহে আমার দোকানে এসে ৫০০০ টাকা চাঁদা দাবি করেছে। না দিলে দোকান বন্ধ করে দেওয়ার হুমকি দিয়েছে।', 'approved', NOW() - INTERVAL '12 days'),
    (karim_id, 'এলাকার সব দোকানদারদের কাছ থেকে মাসিক চাঁদা নেয়। পুলিশে অভিযোগ করলেও কোনো ব্যবস্থা নেওয়া হয়নি।', 'approved', NOW() - INTERVAL '10 days'),
    (karim_id, 'নতুন ব্যবসায়ীদের কাছ থেকে বেশি টাকা দাবি করে। হুমকি দিয়ে টাকা আদায় করে।', 'approved', NOW() - INTERVAL '8 days'),
    (karim_id, 'স্থানীয় বাজারে তার দাপট। কেউ কিছু বলতে পারে না ভয়ে।', 'approved', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Rafiqul Islam (4 reports)
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (rafiq_id, 'এলাকার ছোট ব্যবসায়ীদের কাছ থেকে সাপ্তাহিক চাঁদা নেয়। না দিলে দোকান ভাঙচুরের হুমকি দেয়।', 'approved', NOW() - INTERVAL '20 days'),
    (rafiq_id, 'রিকশাওয়ালাদের কাছ থেকেও চাঁদা নেয়। দৈনিক ২০ টাকা করে।', 'approved', NOW() - INTERVAL '18 days'),
    (rafiq_id, 'স্থানীয় মার্কেটে তার লোকজন পাহারা দেয়। সবাই ভয়ে থাকে।', 'approved', NOW() - INTERVAL '15 days'),
    (rafiq_id, 'নতুন দোকান খুললেই চাঁদা দাবি করে। অনেকেই ব্যবসা বন্ধ করে দিয়েছে।', 'approved', NOW() - INTERVAL '12 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Abdul Rahim (3 reports)
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (rahim_id, 'স্থানীয় ব্যবসায়ীদের কাছ থেকে নিয়মিত চাঁদা আদায় করে। হুমকি দিয়ে টাকা আদায় করে।', 'approved', NOW() - INTERVAL '25 days'),
    (rahim_id, 'পুলিশে অভিযোগ করলেও কোনো ব্যবস্থা নেওয়া হয়নি। রাজনৈতিক প্রভাব আছে।', 'approved', NOW() - INTERVAL '22 days'),
    (rahim_id, 'এলাকার মানুষ তাকে ভয় পায়। কেউ প্রতিবাদ করতে পারে না।', 'approved', NOW() - INTERVAL '20 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Salahuddin Ahmed (2 reports)
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (salah_id, 'ছোট ব্যবসায়ীদের কাছ থেকে চাঁদা নেয়। মাসিক ১০০০ টাকা করে।', 'approved', NOW() - INTERVAL '30 days'),
    (salah_id, 'স্থানীয় বাজারে তার নিয়ন্ত্রণ। সবাই বাধ্য হয়ে টাকা দেয়।', 'approved', NOW() - INTERVAL '28 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Nasir Uddin (1 report)
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (nasir_id, 'নতুন এলাকায় এসে চাঁদাবাজি শুরু করেছে। দোকানদাররা চিন্তিত।', 'approved', NOW() - INTERVAL '35 days')
    ON CONFLICT DO NOTHING;

    -- Insert some pending reports
    INSERT INTO reports (chadabaz_id, description, status, created_at) VALUES
    (ali_id, 'এই ব্যক্তি সম্পর্কে তদন্ত চলছে। শীঘ্রই আরো তথ্য পাওয়া যাবে।', 'pending', NOW() - INTERVAL '3 days'),
    (kamal_id, 'স্থানীয় এলাকায় চাঁদাবাজির অভিযোগ পাওয়া গেছে।', 'pending', NOW() - INTERVAL '2 days'),
    (jahid_id, 'নতুন অভিযোগ এসেছে। যাচাই করা হচ্ছে।', 'pending', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

END $$;
