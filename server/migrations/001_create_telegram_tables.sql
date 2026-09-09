-- Telegram chat tracking
CREATE TABLE IF NOT EXISTS telegram_chats (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  username TEXT,
  first_joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User contributions tracking
CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES telegram_chats(id),
  user_id BIGINT NOT NULL,
  amount INTEGER NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_contributions_chat_user
  ON contributions(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_contributions_contributed_at
  ON contributions(contributed_at DESC);
  -- Telegram chat tracking

CREATE TABLE IF NOT EXISTS telegram_chats (
  id BIGINT PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  username TEXT,
  first_joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User contributions tracking

CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES telegram_chats(id),
  user_id BIGINT NOT NULL,
  amount INTEGER NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_contributions_chat_user
  ON contributions(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_contributions_contributed_at
  ON contributions(contributed_at DESC);

-- Week 20: Broadcast tracking

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS broadcast_deliveries (
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL,
  sent_at TIMESTAMPTZ,
  status TEXT,
  PRIMARY KEY (broadcast_id, chat_id)
);
CREATE TABLE group_members (
  chat_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  first_name TEXT,
  joined_at TIMESTAMPTZ NOT NULL,
  left_at TIMESTAMPTZ,
  role TEXT DEFAULT 'member',
  PRIMARY KEY (chat_id, user_id)
);
CREATE TABLE cron_runs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX idx_cron_runs_job_started
ON cron_runs(job_name, started_at DESC);
CREATE TABLE IF NOT EXISTS contributions (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES telegram_chats(id),
  user_id BIGINT NOT NULL,
  amount INTEGER NOT NULL,
  contributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'completed'
);

CREATE INDEX IF NOT EXISTS idx_contributions_chat_user
  ON contributions(chat_id, user_id);

CREATE INDEX IF NOT EXISTS idx_contributions_contributed_at
  ON contributions(contributed_at DESC);