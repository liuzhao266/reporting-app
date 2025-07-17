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
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can view approved reports" ON report;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can submit chadabaz profiles" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can submit reports" ON report;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can update reports" ON report;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can delete reports" ON report;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can update chadabaz" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can delete chadabaz" ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Public can view parties" ON party;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP POLICY IF EXISTS "Admins can manage parties" ON party;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- Drop triggers (wrapped in EXECUTE with proper exception handling)
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_chadabaz_updated_at ON chadabaz;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_report_updated_at ON report;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;
DO $$ BEGIN BEGIN EXECUTE 'DROP TRIGGER IF EXISTS update_party_updated_at ON party;'; EXCEPTION WHEN OTHERS THEN NULL; END; END $$;

-- Drop views
DROP VIEW IF EXISTS admin_stats;
DROP VIEW IF EXISTS pending_reports; -- New view from your schema

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS chadabaz CASCADE;
DROP TABLE IF EXISTS party CASCADE;

-- Drop storage bucket (if it exists and is not empty)
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM storage.buckets WHERE id = 'chadabaz-media') > 0 THEN
        BEGIN
            PERFORM storage.empty_bucket('chadabaz-media'::text);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not empty bucket "chadabaz-media": %', SQLERRM;
        END;

        BEGIN
            PERFORM storage.delete_bucket('chadabaz-media'::text);
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not delete bucket "chadabaz-media": %', SQLERRM;
        END;
    END IF;
END $$;


-- Step 2: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 3: Create the party table
CREATE TABLE party (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  total_reports INTEGER DEFAULT 0, -- This column is in your schema, but will be dynamically calculated in actions for now
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create the chadabaz table
CREATE TABLE chadabaz (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  political_party_id UUID REFERENCES party(id) ON DELETE SET NULL,
  facebook_link TEXT, -- Keeping this separate as per your schema, but other social links will go into 'profiles'
  profile_picture TEXT, -- URL to image (use Supabase Storage)
  description TEXT, -- New field for general chadabaz description
  profiles JSONB, -- any other extra social links, etc.
  approved_status BOOLEAN DEFAULT FALSE, -- New field for chadabaz approval
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (name, area) -- Ensures unique combination of name and area
);

-- Step 5: Create the report table
CREATE TABLE report (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chadabaz_id UUID REFERENCES chadabaz(id) ON DELETE CASCADE,
  report_text TEXT NOT NULL, -- Renamed from 'description'
  submitted_by TEXT, -- email or name of user (anonymous users can be null)
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Renamed from 'created_at'
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_party_name ON party(name);
CREATE INDEX idx_chadabaz_name ON chadabaz(name);
CREATE INDEX idx_chadabaz_area ON chadabaz(area);
CREATE INDEX idx_chadabaz_political_party_id ON chadabaz(political_party_id);
CREATE INDEX idx_chadabaz_created_at ON chadabaz(created_at);
CREATE INDEX idx_chadabaz_approved_status ON chadabaz(approved_status);
CREATE INDEX idx_report_chadabaz_id ON report(chadabaz_id);
CREATE INDEX idx_report_status ON report(status);
CREATE INDEX idx_report_submitted_at ON report(submitted_at);

-- Step 7: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create triggers for updated_at
CREATE TRIGGER update_party_updated_at
    BEFORE UPDATE ON party
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chadabaz_updated_at
    BEFORE UPDATE ON chadabaz
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Note: 'report' table does not have an 'updated_at' column in your new schema,
-- so no trigger is created for it.

-- Step 9: Create policies for public read and insert access
ALTER TABLE party ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view parties" ON party
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage parties" ON party
  FOR ALL USING (true) WITH CHECK (true); -- For admin to add/edit parties

ALTER TABLE chadabaz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved chadabaz profiles" ON chadabaz
  FOR SELECT USING (approved_status = TRUE); -- Only approved chadabaz are public
CREATE POLICY "Public can submit chadabaz profiles" ON chadabaz
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update chadabaz" ON chadabaz
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete chadabaz" ON chadabaz
  FOR DELETE USING (true);

ALTER TABLE report ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view approved reports" ON report
  FOR SELECT USING (status = 'approved');
CREATE POLICY "Public can submit reports" ON report
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update reports" ON report
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can delete reports" ON report
  FOR DELETE USING (true);

-- Step 10: Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM report) as total_reports,
  (SELECT COUNT(*) FROM report WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM report WHERE status = 'approved') as approved_reports,
  (SELECT COUNT(*) FROM report WHERE status = 'rejected') as rejected_reports,
  (SELECT COUNT(*) FROM chadabaz) as total_chadabaz;

-- Grant access to the view
GRANT SELECT ON admin_stats TO anon, authenticated;

-- Step 11: Create the pending_reports view
CREATE OR REPLACE VIEW pending_reports AS
SELECT
  r.id as report_id,
  c.id as chadabaz_id,
  c.name,
  r.report_text,
  r.submitted_by,
  r.submitted_at
FROM report r
JOIN chadabaz c ON r.chadabaz_id = c.id
WHERE r.status = 'pending';

-- Step 12: Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chadabaz-media', 'chadabaz-media', true)
ON CONFLICT (id) DO NOTHING;

-- Step 13: Create storage policies for chadabaz-media bucket
CREATE POLICY "Public can upload media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can update media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'chadabaz-media');

CREATE POLICY "Public can delete media" ON storage.objects
  FOR DELETE USING (bucket_id = 'chadabaz-media');

-- Step 14: Insert sample data
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
    INSERT INTO party (name) VALUES
    ('আওয়ামী লীগ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_awami_league_id;
    INSERT INTO party (name) VALUES
    ('বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_bnp_id;
    INSERT INTO party (name) VALUES
    ('জাতীয় পার্টি (এরশাদ)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jatiya_id;
    INSERT INTO party (name) VALUES
    ('জামায়াতে ইসলামী বাংলাদেশ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jamaat_id;
    INSERT INTO party (name) VALUES
    ('বাংলাদেশ তরিকত ফেডারেশন') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_torikot_id;
    INSERT INTO party (name) VALUES
    ('জাতীয় সমাজতান্ত্রিক দল (জাসদ)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jasod_id;
    INSERT INTO party (name) VALUES
    ('বাংলাদেশ ওয়ার্কার্স পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_workers_id;
    INSERT INTO party (name) VALUES
    ('গণতন্ত্রী পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gonotontri_id;
    INSERT INTO party (name) VALUES
    ('লিবারেল ডেমোক্রেটিক পার্টি (এলডিপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_ldp_id;
    INSERT INTO party (name) VALUES
    ('বাংলাদেশ খেলাফত মজলিস') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_khelafat_id;
    INSERT INTO party (name) VALUES
    ('ইসলামী ঐক্যজোট') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_islamic_oikkojot_id;
    INSERT INTO party (name) VALUES
    ('গণ অধিকার পরিষদ') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gon_odhikar_id;
    INSERT INTO party (name) VALUES
    ('জাতীয় নাগরিক পার্টি (এনসিপি)') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_jatiya_nagorik_id;
    INSERT INTO party (name) VALUES
    ('বাংলাদেশ কল্যাণ পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_kollan_id;
    INSERT INTO party (name) VALUES
    ('জাতীয় মুক্তি কাউন্সিল') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_mukti_council_id;
    INSERT INTO party (name) VALUES
    ('বিপ্লবী ওয়ার্কার্স পার্টি') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_biplobi_workers_id;
    INSERT INTO party (name) VALUES
    ('গণফোরাম') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_gonoforum_id;
    INSERT INTO party (name) VALUES
    ('সম্মিলিত সামাজিক আন্দোলন') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_shommilito_shomajik_id;
    INSERT INTO party (name) VALUES
    ('অন্যান্য') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_other_id;
    INSERT INTO party (name) VALUES
    ('কোনো দলের সাথে সম্পৃক্ত নয়') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO party_no_affiliation_id;

    -- Insert sample chadabaz data with political_party_id and approved_status
    INSERT INTO chadabaz (name, area, political_party_id, facebook_link, profile_picture, description, profiles, approved_status) VALUES
    ('মোহাম্মদ করিম', 'ঢাকা, ধানমন্ডি', party_awami_league_id, 'https://facebook.com/mohammad.karim', '/placeholder.svg?height=100&width=100', 'একজন পরিচিত চাঁদাবাজ, বিভিন্ন ব্যবসায়ীদের কাছ থেকে নিয়মিত চাঁদা আদায় করে।', '{"twitter": "https://twitter.com/mkarim", "instagram": "https://instagram.com/mohammad_karim"}', TRUE),
    ('আব্দুল রহিম', 'চট্টগ্রাম, আগ্রাবাদ', party_bnp_id, 'https://facebook.com/abdul.rahim', '/placeholder.svg?height=100&width=100', 'রাজনৈতিক প্রভাব খাটিয়ে চাঁদাবাজি করে।', '{"youtube": "https://youtube.com/@abdulrahim"}', TRUE),
    ('সালাহউদ্দিন আহমেদ', 'সিলেট, জিন্দাবাজার', party_jatiya_id, NULL, '/placeholder.svg?height=100&width=100', 'ছোট ব্যবসায়ীদের টার্গেট করে।', '{"linkedin": "https://linkedin.com/in/salahuddin", "tiktok": "https://tiktok.com/@salahuddin"}', TRUE),
    ('রফিকুল ইসলাম', 'রাজশাহী, বোয়ালিয়া', party_awami_league_id, NULL, '/placeholder.svg?height=100&width=100', 'এলাকার রিকশাওয়ালাদের কাছ থেকে চাঁদা নেয়।', NULL, TRUE),
    ('নাসির উদ্দিন', 'খুলনা, দৌলতপুর', party_bnp_id, NULL, '/placeholder.svg?height=100&width=100', 'নতুন এলাকায় এসে চাঁদাবাজি শুরু করেছে।', NULL, TRUE),
    ('আলী হাসান', 'বরিশাল, বন্দর', party_jamaat_id, NULL, '/placeholder.svg?height=100&width=100', 'তদন্তাধীন চাঁদাবাজ।', NULL, FALSE), -- Pending approval
    ('কামাল উদ্দিন', 'রংপুর, গঙ্গাচড়া', party_awami_league_id, NULL, '/placeholder.svg?height=100&width=100', 'স্থানীয় এলাকায় চাঁদাবাজির অভিযোগ পাওয়া গেছে।', NULL, FALSE), -- Pending approval
    ('জাহিদ হোসেন', 'ময়মনসিংহ, ত্রিশাল', party_bnp_id, NULL, '/placeholder.svg?height=100&width=100', 'নতুন অভিযোগ এসেছে।', NULL, FALSE) -- Pending approval
    ON CONFLICT (name, area) DO NOTHING;

    -- Get chadabaz IDs
    SELECT id INTO karim_id FROM chadabaz WHERE name = 'মোহাম্মদ করিম' AND area = 'ঢাকা, ধানমন্ডি' LIMIT 1;
    SELECT id INTO rahim_id FROM chadabaz WHERE name = 'আব্দুল রহিম' AND area = 'চট্টগ্রাম, আগ্রাবাদ' LIMIT 1;
    SELECT id INTO salah_id FROM chadabaz WHERE name = 'সালাহউদ্দিন আহমেদ' AND area = 'সিলেট, জিন্দাবাজার' LIMIT 1;
    SELECT id INTO rafiq_id FROM chadabaz WHERE name = 'রফিকুল ইসলাম' AND area = 'রাজশাহী, বোয়ালিয়া' LIMIT 1;
    SELECT id INTO nasir_id FROM chadabaz WHERE name = 'নাসির উদ্দিন' AND area = 'খুলনা, দৌলতপুর' LIMIT 1;
    SELECT id INTO ali_id FROM chadabaz WHERE name = 'আলী হাসান' AND area = 'বরিশাল, বন্দর' LIMIT 1;
    SELECT id INTO kamal_id FROM chadabaz WHERE name = 'কামাল উদ্দিন' AND area = 'রংপুর, গঙ্গাচড়া' LIMIT 1;
    SELECT id INTO jahid_id FROM chadabaz WHERE name = 'জাহিদ হোসেন' AND area = 'ময়মনসিংহ, ত্রিশাল' LIMIT 1;

    -- Insert reports for Mohammad Karim (5 reports - highest)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (karim_id, 'এই ব্যক্তি আমাদের এলাকায় নিয়মিত চাঁদা দাবি করে। দোকানদারদের কাছ থেকে জোর করে টাকা নেয়। স্থানীয় যুবকদের দিয়ে ভয় দেখায়। গত মাসে আমার দোকানে এসে ৫০০০ টাকা চাঁদা দাবি করেছে।', 'approved', NOW() - INTERVAL '15 days'),
    (karim_id, 'গত সপ্তাহে আমার দোকানে এসে ৫০০০ টাকা চাঁদা দাবি করেছে। না দিলে দোকান বন্ধ করে দেওয়ার হুমকি দিয়েছে।', 'approved', NOW() - INTERVAL '12 days'),
    (karim_id, 'এলাকার সব দোকানদারদের কাছ থেকে মাসিক চাঁদা নেয়। পুলিশে অভিযোগ করলেও কোনো ব্যবস্থা নেওয়া হয়নি।', 'approved', NOW() - INTERVAL '10 days'),
    (karim_id, 'নতুন ব্যবসায়ীদের কাছ থেকে বেশি টাকা দাবি করে। হুমকি দিয়ে টাকা আদায় করে।', 'approved', NOW() - INTERVAL '8 days'),
    (karim_id, 'স্থানীয় বাজারে তার দাপট। কেউ কিছু বলতে পারে না ভয়ে।', 'approved', NOW() - INTERVAL '5 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Rafiqul Islam (4 reports)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (rafiq_id, 'এলাকার ছোট ব্যবসায়ীদের কাছ থেকে সাপ্তাহিক চাঁদা নেয়। না দিলে দোকান ভাঙচুরের হুমকি দেয়।', 'approved', NOW() - INTERVAL '20 days'),
    (rafiq_id, 'রিকশাওয়ালাদের কাছ থেকেও চাঁদা নেয়। দৈনিক ২০ টাকা করে।', 'approved', NOW() - INTERVAL '18 days'),
    (rafiq_id, 'স্থানীয় মার্কেটে তার লোকজন পাহারা দেয়। সবাই ভয়ে থাকে।', 'approved', NOW() - INTERVAL '15 days'),
    (rafiq_id, 'নতুন দোকান খুললেই চাঁদা দাবি করে। অনেকেই ব্যবসা বন্ধ করে দিয়েছে।', 'approved', NOW() - INTERVAL '12 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Abdul Rahim (3 reports)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (rahim_id, 'স্থানীয় ব্যবসায়ীদের কাছ থেকে নিয়মিত চাঁদা আদায় করে। হুমকি দিয়ে টাকা আদায় করে।', 'approved', NOW() - INTERVAL '25 days'),
    (rahim_id, 'পুলিশে অভিযোগ করলেও কোনো ব্যবস্থা নেওয়া হয়নি। রাজনৈতিক প্রভাব আছে।', 'approved', NOW() - INTERVAL '22 days'),
    (rahim_id, 'এলাকার মানুষ তাকে ভয় পায়। কেউ প্রতিবাদ করতে পারে না।', 'approved', NOW() - INTERVAL '20 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Salahuddin Ahmed (2 reports)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (salah_id, 'ছোট ব্যবসায়ীদের কাছ থেকে চাঁদা নেয়। মাসিক ১০০০ টাকা করে।', 'approved', NOW() - INTERVAL '30 days'),
    (salah_id, 'স্থানীয় বাজারে তার নিয়ন্ত্রণ। সবাই বাধ্য হয়ে টাকা দেয়।', 'approved', NOW() - INTERVAL '28 days')
    ON CONFLICT DO NOTHING;

    -- Insert reports for Nasir Uddin (1 report)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (nasir_id, 'নতুন এলাকায় এসে চাঁদাবাজি শুরু করেছে। দোকানদাররা চিন্তিত।', 'approved', NOW() - INTERVAL '35 days')
    ON CONFLICT DO NOTHING;

    -- Insert some pending reports (for chadabaz that are not yet approved)
    INSERT INTO report (chadabaz_id, report_text, status, submitted_at) VALUES
    (ali_id, 'এই ব্যক্তি সম্পর্কে তদন্ত চলছে। শীঘ্রই আরো তথ্য পাওয়া যাবে।', 'pending', NOW() - INTERVAL '3 days'),
    (kamal_id, 'স্থানীয় এলাকায় চাঁদাবাজির অভিযোগ পাওয়া গেছে।', 'pending', NOW() - INTERVAL '2 days'),
    (jahid_id, 'নতুন অভিযোগ এসেছে। যাচাই করা হচ্ছে।', 'pending', NOW() - INTERVAL '1 day')
    ON CONFLICT DO NOTHING;

END $$;
