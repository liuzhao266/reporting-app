-- Insert sample chadabaz data
INSERT INTO chadabaz (name, location, party, facebook_url, twitter_url, instagram_url) VALUES
('মোহাম্মদ করিম', 'ঢাকা, ধানমন্ডি', 'আওয়ামী লীগ', 'https://facebook.com/mohammad.karim', 'https://twitter.com/mkarim', 'https://instagram.com/mohammad_karim'),
('আব্দুল রহিম', 'চট্টগ্রাম, আগ্রাবাদ', 'বাংলাদেশ জাতীয়তাবাদী দল (বিএনপি)', 'https://facebook.com/abdul.rahim', NULL, NULL),
('সালাহউদ্দিন আহমেদ', 'সিলেট, জিন্দাবাজার', 'জাতীয় পার্টি (এরশাদ)', NULL, NULL, NULL),
('রফিকুল ইসলাম', 'রাজশাহী, বোয়ালিয়া', 'আওয়ামী লীগ', NULL, NULL, NULL),
('নাসির উদ্দিন', 'খুলনা, দৌলতপুর', 'বিএনপি', NULL, NULL, NULL),
('আলী হাসান', 'বরিশাল, বন্দর', 'জামায়াতে ইসলামী বাংলাদেশ', NULL, NULL, NULL),
('কামাল উদ্দিন', 'রংপুর, গঙ্গাচড়া', 'আওয়ামী লীগ', NULL, NULL, NULL),
('জাহিদ হোসেন', 'ময়মনসিংহ, ত্রিশাল', 'বিএনপি', NULL, NULL, NULL)
ON CONFLICT (name, location) DO NOTHING; -- Added ON CONFLICT to prevent errors if run multiple times

-- Insert sample reports (we'll get the chadabaz IDs first)
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
