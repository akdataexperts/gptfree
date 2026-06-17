-- GPTFree dedicated tables (separate from aiso `users` table)

CREATE TABLE IF NOT EXISTS gptfree_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  workos_user_id TEXT UNIQUE,
  avatar_url TEXT,
  profile_picture_url TEXT,
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gptfree_users_email ON gptfree_users(email);
CREATE INDEX IF NOT EXISTS idx_gptfree_users_workos_user_id ON gptfree_users(workos_user_id);

CREATE TABLE IF NOT EXISTS gptfree_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES gptfree_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  path TEXT,
  user_agent TEXT,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gptfree_visits_user_id ON gptfree_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_gptfree_visits_email ON gptfree_visits(email);
CREATE INDEX IF NOT EXISTS idx_gptfree_visits_visited_at ON gptfree_visits(visited_at DESC);

CREATE TABLE IF NOT EXISTS gptfree_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES gptfree_users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New chat',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gptfree_conversations_user_id ON gptfree_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_gptfree_conversations_email ON gptfree_conversations(email);
CREATE INDEX IF NOT EXISTS idx_gptfree_conversations_updated_at ON gptfree_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS gptfree_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES gptfree_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gptfree_messages_conversation_id ON gptfree_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_gptfree_messages_created_at ON gptfree_messages(conversation_id, created_at);
