CREATE TABLE IF NOT EXISTS usage_months (
  month TEXT PRIMARY KEY,
  uploads INTEGER NOT NULL DEFAULT 0,
  image_reads INTEGER NOT NULL DEFAULT 0,
  bytes_uploaded INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS share_cards (
  id TEXT PRIMARY KEY,
  object_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  return_url TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS share_cards_expires_at_idx ON share_cards (expires_at);

CREATE TABLE IF NOT EXISTS upload_clients (
  day TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  uploads INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, client_hash)
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  share_id TEXT NOT NULL,
  return_url TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (share_id) REFERENCES share_cards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON oauth_states (expires_at);
