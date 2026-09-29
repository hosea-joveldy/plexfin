-- Enable RLS on all tables
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Public data: All authenticated users can read
CREATE POLICY content_select ON content FOR SELECT TO authenticated USING (true);
CREATE POLICY genres_select ON genres FOR SELECT TO authenticated USING (true);
CREATE POLICY languages_select ON languages FOR SELECT TO authenticated USING (true);
CREATE POLICY ratings_select ON ratings FOR SELECT TO authenticated USING (true);

-- User-specific data: Read/write own records
CREATE POLICY watch_history_user ON watch_history FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY reviews_user ON reviews FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY settings_user ON settings FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY user_ratings_user ON user_ratings FOR ALL TO authenticated USING (user_id = auth.uid());

-- Profiles: Read own profile only
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Admins can manage content
CREATE POLICY content_admin ON content FOR INSERT, UPDATE, DELETE TO authenticated USING (auth.jwt() ->> 'role' = 'admin');

-- Content ratings (read own)
CREATE POLICY content_ratings_user ON content_ratings FOR SELECT TO authenticated USING (user_id = auth.uid());