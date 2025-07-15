-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the chadabaz table with social media URLs
CREATE TABLE IF NOT EXISTS chadabaz (
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
  -- Add a unique constraint on name and location
  UNIQUE (name, location)
);

-- Create the reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chadabaz_id UUID REFERENCES chadabaz(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  media_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chadabaz_name ON chadabaz(name);
CREATE INDEX IF NOT EXISTS idx_chadabaz_location ON chadabaz(location);
CREATE INDEX IF NOT EXISTS idx_chadabaz_party ON chadabaz(party);
CREATE INDEX IF NOT EXISTS idx_chadabaz_created_at ON chadabaz(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_chadabaz_id ON reports(chadabaz_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- Enable Row Level Security
ALTER TABLE chadabaz ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public can view chadabaz profiles" ON chadabaz
  FOR SELECT USING (true);

CREATE POLICY "Public can view approved reports" ON reports
  FOR SELECT USING (status = 'approved');

-- Create policies for public insert (for new submissions)
CREATE POLICY "Public can submit chadabaz profiles" ON chadabaz
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can submit reports" ON reports
  FOR INSERT WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_chadabaz_updated_at 
    BEFORE UPDATE ON chadabaz 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at 
    BEFORE UPDATE ON reports 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
