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
  -- A chama is a telegram group chat.
CREATE TABLE chamas (
  chat_id BIGINT PRIMARY KEY REFERENCES telegram_chats(id),
  name TEXT NOT NULL,
  monthly_amount_cents INTEGER NOT NULL CHECK (monthly_amount_cents > 0),
  fine_percent NUMERIC(5,2) DEFAULT 2.00,
  cycle_day INTEGER NOT NULL DEFAULT 1 CHECK (cycle_day BETWEEN 1 AND 28),
  treasurer_user_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chama_members (
  chama_id BIGINT REFERENCES chamas(chat_id),
  user_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  PRIMARY KEY (chama_id, user_id)
);

CREATE TABLE cycles (
  id BIGSERIAL PRIMARY KEY,
  chama_id BIGINT REFERENCES chamas(chat_id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'cancelled')),
  expected_total_cents INTEGER NOT NULL,
  UNIQUE (chama_id, period_start)
);

CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id BIGINT REFERENCES cycles(id),
  chama_id BIGINT,
  member_user_id BIGINT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  mpesa_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE TABLE fines (
  id BIGSERIAL PRIMARY KEY,
  cycle_id BIGINT REFERENCES cycles(id),
  member_user_id BIGINT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payouts (
  id BIGSERIAL PRIMARY KEY,
  chama_id BIGINT,
  recipient_user_id BIGINT NOT NULL,
  amount_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  paid_at TIMESTAMPTZ,
  created_by BIGINT NOT NULL
);