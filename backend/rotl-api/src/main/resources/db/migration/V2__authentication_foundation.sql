-- Authentication foundation: persist pending credentials as Argon2id hashes only.
ALTER TABLE account_requests
  ADD COLUMN first_name VARCHAR(80),
  ADD COLUMN last_name VARCHAR(80),
  ADD COLUMN email VARCHAR(190),
  ADD COLUMN phone VARCHAR(30),
  ADD COLUMN password_hash VARCHAR(255);

CREATE INDEX ix_account_requests_company_status
  ON account_requests(company_id, status, created_at DESC);

CREATE UNIQUE INDEX uq_users_company_email_lower
  ON users(company_id, lower(email)) WHERE email IS NOT NULL;

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ix_refresh_tokens_user_active
  ON refresh_tokens(user_id, expires_at) WHERE revoked_at IS NULL;
