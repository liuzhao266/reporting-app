-- =================================================================================================
-- WARNING: This script will drop and recreate all specified tables, functions, triggers, policies,
-- and storage buckets. Any existing data in these tables will be lost.
-- Only run this if you intend to reset your database schema and data.
-- =================================================================================================

-- Set search path to include 'storage' schema for storage functions
SET search_path = public, storage;

-- Step 1: Drop existing objects in reverse order of creation to avoid dependency issues
-- Use DO $$ BEGIN BEGIN EXECUTE ... EXCEPTION WHEN OTHERS THEN NULL; END; END $$; blocks
-- to gracefully handle cases where objects/tables might not exist.

-- Drop storage policies first, as they are on a system table (storage.objects)
DROP POLICY IF EXISTS "Public can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
DROP POLICY IF EXISTS "Public can update media" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete media" ON storage.objects;

-- Drop policies on custom tables (wrapped in EXECUTE with proper exception handling)
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can view chadabaz profiles" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can view approved reports" ON reports;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can submit chadabaz profiles" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can submit reports" ON reports;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can update reports" ON reports;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can delete reports" ON reports;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can update chadabaz" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can delete chadabaz" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can view parties" ON parties;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can manage parties" ON parties;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- Drop triggers (wrapped in EXECUTE with proper exception handling)
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_chadabaz_updated_at ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_parties_updated_at ON parties;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- Drop views
DROP VIEW IF EXISTS admin_stats;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS chadabaz CASCADE;
DROP TABLE IF EXISTS parties CASCADE;

-- Drop storage bucket (if it exists and is not empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM storage.buckets WHERE id = 'chadabaz-media') > 0 THEN
        BEGIN
            -- Empty the bucket first, using fully qualified name and explicit cast
            PERFORM storage.empty_bucket('chadabaz-media'::text);
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but continue, as the main goal is schema setup
            RAISE WARNING 'Could not empty bucket "chadabaz-media": %', SQLERRM;
        END;

        BEGIN
            -- Then delete the bucket, using fully qualified name and explicit cast
            PERFORM storage.delete_bucket('chadabaz-media'::text);
        EXCEPTION WHEN OTHERS THEN
            -- Log the error but continue
            RAISE WARNING 'Could not delete bucket "chadabaz-media": %', SQLERRM;
        END;
    END IF;
END $$;


-- Step 2: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create the parties table
CREATE TABLE parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create the chadabaz table with foreign key to parties
CREATE TABLE chadabaz (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE RESTRICT, -- Foreign key to parties table
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

-- Step 5: Create the reports table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chadabaz_id UUID REFERENCES chadabaz(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_parties_name ON parties(name);
CREATE INDEX idx_chadabaz_name ON chadabaz(name);
CREATE INDEX idx_chadabaz_location ON chadabaz(location);
CREATE INDEX idx_chadabaz_party_id ON chadabaz(party_id);
CREATE INDEX idx_chadabaz_created_at ON chadabaz(created_at);
CREATE INDEX idx_reports_chadabaz_id ON reports(chadabaz_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers for updated_at
CREATE TRIGGER update_parties_updated_at
    BEFORE UPDATE ON parties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chadabaz_updated_at 
    BEFORE UPDATE ON chadabaz 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create policies for public read and insert access
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view parties" ON parties
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage parties" ON parties
  FOR ALL USING (true) WITH CHECK (true); -- For admin to add/edit parties

ALTER TABLE chadabaz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view chadabaz profiles" ON chadabaz
  FOR SELECT USING (true);
CREATE POLICY "Public can submit chadabaz profiles" ON chadabaz
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update chadabaz" ON chadabaz
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete chadabaz" ON chadabaz
  FOR DELETE USING (true);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved reports" ON reports
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Public can submit reports" ON reports
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE USING (true);

-- Step 10: Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'approved') as approved_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_reports,
  (SELECT COUNT(*) FROM chadabaz) as total_chadabaz;

-- Grant access to the view
GRANT SELECT ON admin_stats TO anon, authenticated;

-- Step 11: Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chadabaz-media', 'chadabaz-media', true)
ON CONFLICT (id) DO NOTHING;

-- Step 12: Create storage policies for chadabaz-media bucket
CREATE POLICY "Public can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can update media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can delete media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chadabaz-media');

-- Step 13: Insert sample data
DO $$
DECLARE
    party_awami_league_id UUID;
    party_bnp_id UUID;
    party_jatiya_id UUID;
    party_jamaat_id UUID;
    party_torikot_id UUID;
    party_jasod_id UUID;
    party_workers_id UUID;
    party_gonotontri_id UUID;
    party_ldp_id UUID;
    party_khelafat_id UUID;
    party_islamic_oikkojot_id UUID;
    party_gon_odhikar_id UUID;
    party_jatiya_nagorik_id UUID;
    party_kollan_id UUID;
    party_mukti_council_id UUID;
    party_biplobi_workers_id UUID;
    party_gonoforum_id UUID;
    party_shommilito_shomajik_id UUID;
    party_other_id UUID;
    party_no_affiliation_id UUID;

    karim_id UUID;
    rahim_id UUID;
    salah_id UUID;
    rafiq_id UUID;
    nasir_id UUID;
    ali_id UUID;
    kamal_id UUID;
    jahid_id UUID;
BEGIN
    -- Insert parties first
    INSERT INTO parties (name) VALUES
    ('আওয়ামী লীগ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_awami_league_id;
    INSERT INTO parties (name) VALUES
    ('বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_bnp_id;
    INSERT INTO parties (name) VALUES
    ('জাতীয় পার্টি (এরশাদ)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jatiya_id;
    INSERT INTO parties (name) VALUES
    ('জামায়াতে ইসলামী বাংলাদেশ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jamaat_id;
    INSERT INTO parties (name) VALUES
    ('বাংলাদেশ তরিকত ফেডারেশন') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_torikot_id;
    INSERT INTO parties (name) VALUES
    ('জাতীয় সমাজতান্ত্রিক দল (জাসদ)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jasod_id;
    INSERT INTO parties (name) VALUES
    ('বাংলাদেশ ওয়ার্কার্স পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_workers_id;
    INSERT INTO parties (name) VALUES
    ('গণতন্ত্রী পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gonotontri_id;
    INSERT INTO parties (name) VALUES
    ('লিবারেল ডেমোক্রেটিক পার্টি (এলডিপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_ldp_id;
    INSERT INTO parties (name) VALUES
    ('বাংলাদেশ খেলাফত মজলিস') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_khelafat_id;
    INSERT INTO parties (name) VALUES
    ('ইসলামী ঐক্যজোট') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_islamic_oikkojot_id;
    INSERT INTO parties (name) VALUES
    ('গণ অধিকার পরিষদ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gon_odhikar_id;
    INSERT INTO parties (name) VALUES
    ('জাতীয় নাগরিক পার্টি (এনসিপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jatiya_nagorik_id;
    INSERT INTO parties (name) VALUES
    ('বাংলাদেশ কল্যাণ পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_kollan_id;
    INSERT INTO parties (name) VALUES
    ('জাতীয় মুক্তি কাউন্সিল') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_mukti_council_id;
    INSERT INTO parties (name) VALUES
    ('বিপ্লবী ওয়ার্কার্স পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_biplobi_workers_id;
    INSERT INTO parties (name) VALUES
    ('গণফোরাম') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gonoforum_id;
    INSERT INTO parties (name) VALUES
    ('সম্মিলিত সামাজিক আন্দোলন') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_shommilito_shomajik_id;
    INSERT INTO parties (name) VALUES
    ('অন্যান্য') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_other_id;
    INSERT INTO parties (name) VALUES
    ('কোনো দলের সাথে সম্পৃক্ত নয়') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_no_affiliation_id;

    -- Insert sample chadabaz data with party_id
    INSERT INTO chadabaz (name, location, party_id, facebook_url, twitter_url, instagram_url) VALUES
    ('মোহাম্মদ করিম', 'ঢাকা, ধানমন্ডি', party_awami_league_id, 'https://facebook.com/mohammad.karim', 'https://twitter.com/mkarim', 'https://instagram.com/mohammad_karim'),
    ('আব্দুল রহিম', 'চট্টগ্রাম, আগ্রাবাদ', party_bnp_id, 'https://facebook.com/abdul.rahim', NULL, NULL),
    ('সালাহউদ্দিন আহমেদ', 'সিলেট, জিন্দাবাজার', party_jatiya_id, NULL, NULL, NULL),
    ('রফিকুল ইসলাম', 'রাজশাহী, বোয়ালিয়া', party_awami_league_id, NULL, NULL, NULL),
    ('নাসির উদ্দিন', 'খুলনা, দৌলতপুর', party_bnp_id, NULL, NULL, NULL),
    ('আলী হাসান', 'বরিশাল, বন্দর', party_jamaat_id, NULL, NULL, NULL),
    ('কামাল উদ্দিন', 'রংপুর, গঙ্গাচড়া', party_awami_league_id, NULL, NULL, NULL),
    ('জাহিদ হোসেন', 'ময়মনসিংহ, ত্রিশাল', party_bnp_id, NULL, NULL, NULL)
    ON CONFLICT (name, location) DO NOTHING;

    -- Get chadabaz IDs
    SELECT id INTO karim_id FROM chadabaz WHERE name = 'মোহাম্মদ করিম' AND location = 'ঢাকা, ধানমন্ডি' LIMIT 1;
    SELECT id INTO rahim_id FROM chadabaz WHERE name = 'আব্দুল রহিম' AND location = 'চট্টগ্রাম, আগ্রাবাদ' LIMIT 1;
    SELECT id INTO salah_id FROM chadabaz WHERE name = 'সালাহউদ্দিন আহমেদ' AND location = 'সিলেট, জিন্দাবাজার' LIMIT 1;
    SELECT id INTO rafiq_id FROM chadabaz WHERE name = 'রফিকুল ইসলাম' AND location = 'রাজশাহী, বোয়ালিয়া' LIMIT 1;
    SELECT id INTO nasir_id FROM chadabaz WHERE name = 'নাসির উদ্দিন' AND location = 'খুলনা, দৌলতপুর' LIMIT 1;
    SELECT id INTO ali_id FROM chadabaz WHERE name = 'আলী হাসান' AND location = 'বরিশাল, বন্দর' LIMIT 1;
    SELECT id INTO kamal_id FROM chadabaz WHERE name = 'কামাল উদ্দিন' AND location = 'রংপুর, গঙ্গাচড়া' LIMIT 1;
    SELECT id INTO jahid_id FROM chadabaz WHERE name = 'জাহিদ হোসেন' AND location = 'ময়মনসিংহ, ত্রিশাল' LIMIT 1;

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
