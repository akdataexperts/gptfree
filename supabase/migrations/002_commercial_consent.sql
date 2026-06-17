-- Add commercial data usage consent timestamp for first-login approval flow

ALTER TABLE gptfree_users
  ADD COLUMN IF NOT EXISTS commercial_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN gptfree_users.commercial_consent_at IS
  'Timestamp when the user accepted commercial use of their data';
