-- Create admin policies for full access to data
-- Note: In production, you should create proper admin roles and authentication

-- Allow admins to update report status
CREATE POLICY "Admins can update reports" ON reports
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Allow admins to delete reports
CREATE POLICY "Admins can delete reports" ON reports
  FOR DELETE USING (true);

-- Allow admins to update chadabaz profiles
CREATE POLICY "Admins can update chadabaz" ON chadabaz
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Allow admins to delete chadabaz profiles
CREATE POLICY "Admins can delete chadabaz" ON chadabaz
  FOR DELETE USING (true);

-- Create a view for admin dashboard statistics
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'pending') as pending_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'approved') as approved_reports,
  (SELECT COUNT(*) FROM reports WHERE status = 'rejected') as rejected_reports,
  (SELECT COUNT(*) FROM chadabaz) as total_chadabaz;

-- Grant access to the view
GRANT SELECT ON admin_stats TO anon, authenticated;
