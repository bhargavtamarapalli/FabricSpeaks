-- Create an admin profile for local development
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE username = 'admin') THEN
    INSERT INTO profiles (user_id, username, role, created_at, updated_at)
    VALUES (gen_random_uuid(), 'admin', 'admin', now(), now());
  END IF;
END$$;
