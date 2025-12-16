-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'player',
  banned BOOLEAN DEFAULT FALSE,
  banned_until TIMESTAMP,
  disqualified BOOLEAN DEFAULT FALSE,
  disqualified_reason TEXT,
  disqualified_at TIMESTAMP,
  disqualified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- Event participants
CREATE TABLE IF NOT EXISTS event_participants (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Game rounds
CREATE TABLE IF NOT EXISTS game_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting',
  created_by UUID REFERENCES users(id),
  started_at TIMESTAMP,
  finished_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Round participants
CREATE TABLE IF NOT EXISTS round_participants (
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'waiting',
  score INTEGER DEFAULT 0,
  metadata JSONB,
  eliminated_at TIMESTAMP,
  finished_at TIMESTAMP,
  PRIMARY KEY (round_id, user_id)
);

-- Scores (final scores after round ends)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  game_type VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game events (for event-based scoring)
CREATE TABLE IF NOT EXISTS game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suspicious activities
CREATE TABLE IF NOT EXISTS suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  reason VARCHAR(200) NOT NULL,
  details JSONB,
  severity VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'pending',
  admin_decision UUID REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Security alerts (3+ suspicious activities)
CREATE TABLE IF NOT EXISTS security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  activity_count INTEGER NOT NULL,
  activities JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  admin_decision UUID REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_participants_event ON event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user ON event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_round_participants_round ON round_participants(round_id);
CREATE INDEX IF NOT EXISTS idx_round_participants_user ON round_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_event_user ON scores(event_id, user_id);
CREATE INDEX IF NOT EXISTS idx_scores_round ON scores(round_id);
CREATE INDEX IF NOT EXISTS idx_game_events_round_user ON game_events(round_id, user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_suspicious_user_event ON suspicious_activities(user_id, event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_suspicious_status ON suspicious_activities(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_security_alerts_user_event ON security_alerts(user_id, event_id);

-- Create default admin user (password: admin123 - change this!)
-- Note: You need to generate a proper bcrypt hash for 'admin123'
-- Use: node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(h => console.log(h));"
-- For now, this will fail - create admin user manually or use the register endpoint first

