-- Supabase Authentication Configuration
-- Run this in Supabase SQL Editor or via CLI: psql -h <project-ref>.supabase.co -U postgres -d postgres -f auth-setup.sql

-- 1. Configure Auth Provider Settings
INSERT INTO auth.email_templates (id, enabled, email_subject, email_body, from_email, from_name)
VALUES 
  (
    'welcome',
    true,
    'Welcome to PlexFin!',
    '<p>Hi {{.email}},</p>
     <p>Welcome to PlexFin! We''re excited to have you join our community of short film and TV show enthusiasts.</p>
     <p>Please verify your email address to complete your registration.</p>
     <p><a href="{{.ConfirmationLink}}">Verify Email</a></p>
     <p>If you didn''t create this account, please ignore this email.</p>
     <p>Best regards,<br>The PlexFin Team</p>',
    'noreply@plexfin.com',
    'PlexFin'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.email_templates (id, enabled, email_subject, email_body, from_email, from_name)
VALUES 
  (
    'recover',
    true,
    'Reset Your PlexFin Password',
    '<p>Hi {{.email}},</p>
     <p>We received a request to reset your password. Click the button below to create a new password:</p>
     <p><a href="{{.ConfirmationLink}}">Reset Password</a></p>
     <p>This link will expire in 24 hours.</p>
     <p>If you didn''t request this, please ignore this email and your password will remain unchanged.</p>
     <p>Best regards,<br>The PlexFin Team</p>',
    'noreply@plexfin.com',
    'PlexFin'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.email_templates (id, enabled, email_subject, email_body, from_email, from_name)
VALUES 
  (
    'mfa_otp',
    true,
    'PlexFin Two-Factor Code',
    '<p>Hi {{.email}},</p>
     <p>Your two-factor authentication code is:</p>
     <h2 style="font-size: 24px; letter-spacing: 4px; text-align: center;">{{.Token}}</h2>
     <p>This code will expire in 5 minutes.</p>
     <p>If you didn''t request this code, please contact support immediately.</p>
     <p>Best regards,<br>The PlexFin Team</p>',
    'noreply@plexfin.com',
    'PlexFin'
  )
ON CONFLICT (id) DO NOTHING;

-- 2. Configure Email and Password Policies
INSERT INTO auth.password_policy (id, name, enabled, min_length, max_length, require_numbers, require_uppercase, require_lowercase, require_special_characters, reset_period_days)
VALUES 
  (
    'plexfin_default',
    'PlexFin Default Password Policy',
    true,
    12,
    128,
    true,
    true,
    true,
    true,
    30
  )
ON CONFLICT (id) DO NOTHING;

-- 3. Configure Email Confirmation Settings
UPDATE auth.users
SET 
  email_confirmed_at = NULL,
  confirmation_token = NULL,
  confirmation_sent_at = NULL
WHERE 
  confirmation_token IS NOT NULL;

INSERT INTO auth.settings (id, site_url, enabled, disable_signup, email_enable_signup, email_confirm_signup, email_change_requires_confirmation, email_double_confirm_changes, secure_email_change, enable_signup)
VALUES 
  (
    'default',
    'https://plexfin.com',
    true,
    false,
    true,
    true,
    true,
    true,
    true,
    true
  )
ON CONFLICT (id) DO NOTHING;

-- 4. Create Public Profile Function
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_data JSONB;
BEGIN
  SELECT json_build_object(
    'id', id,
    'name', name,
    'email', email,
    'created_at', created_at,
    'updated_at', updated_at,
    'avatar_url', avatar_url
  )
  INTO profile_data
  FROM public.profiles
  WHERE id = user_id;
  
  RETURN profile_data;
END;
$$;

-- 5. Create Profile Creation Trigger on User Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, name, email, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 6. Create Trigger to Update Profile on Email Change
CREATE OR REPLACE FUNCTION public.handle_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.email <> NEW.email THEN
    -- Update profile email when user email changes
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 7. Create Trigger to Update Profile on Metadata Update
CREATE OR REPLACE FUNCTION public.handle_profile_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile name and avatar_url when user metadata changes
  UPDATE public.profiles
  SET 
    name = COALESCE(NEW.raw_user_meta_data->>'name', COALESCE(name, NEW.email)),
    avatar_url = NEW.raw_user_meta_data->>'avatar_url',
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 8. Apply Triggers to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_email_change();

DROP TRIGGER IF EXISTS on_auth_user_metadata_updated ON auth.users;
CREATE TRIGGER on_auth_user_metadata_updated
  AFTER UPDATE OF raw_user_meta_data ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_update();

-- 9. Create Auth Security Extensions (if available in your Supabase plan)
-- These provide additional security features for authentication
-- Note: Check your Supabase project settings to see which are available

-- Configure Brute Force Protection (if available)
INSERT INTO auth.brute_force_settings (id, enabled, failure_threshold, cooldown_seconds)
VALUES 
  (
    'plexfin_brute_force',
    true,
    5,
    900
  )
ON CONFLICT (id) DO NOTHING;

-- Configure IP Blocking (if available)
INSERT INTO auth.ip_blocklist_settings (id, enabled, permanent_threshold, temporary_threshold, temporary_block_duration_minutes)
VALUES 
  (
    'plexfin_ip_block',
    true,
    10,
    20,
    60
  )
ON CONFLICT (id) DO NOTHING;

-- 10. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);

-- 11. Grant Permissions on Profiles Table
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 12. Verify Setup
SELECT 
  'Email Templates Configured' as status,
  COUNT(*) as count
FROM auth.email_templates
WHERE enabled = true

UNION ALL

SELECT 
  'Password Policy Configured' as status,
  COUNT(*) as count
FROM auth.password_policy
WHERE enabled = true

UNION ALL

SELECT 
  'Triggers Created' as status,
  COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_name LIKE 'on_%_%';

-- Output configuration summary
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PlexFin Authentication Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✓ Email templates configured (welcome, recover, mfa_otp)';
  RAISE NOTICE '✓ Password policy: 12-128 chars, requires uppercase, lowercase, numbers, special chars';
  RAISE NOTICE '✓ Email confirmation required on signup';
  RAISE NOTICE '✓ Profile auto-created on user signup';
  RAISE NOTICE '✓ Triggers configured for email changes and metadata updates';
  RAISE NOTICE '✓ Brute force protection enabled';
  RAISE NOTICE '✓ Indexes created for performance';
  RAISE NOTICE '========================================';
END $$;
