-- Add session table for connect-pg-simple
-- This table stores session data for express-session with PostgreSQL store

CREATE TABLE IF NOT EXISTS session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);

-- Primary key constraint
ALTER TABLE session ADD CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE;

-- Index on expire for cleanup performance
CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);

-- Function to clean up expired sessions (optional, can be called periodically)
-- CREATE OR REPLACE FUNCTION clean_expired_sessions() RETURNS void AS $$
-- BEGIN
--   DELETE FROM session WHERE expire < NOW();
-- END;
-- $$ LANGUAGE plpgsql;

COMMIT;
