-- Apply before deploying the Group Sessions feature to an existing PostgreSQL database.
-- New dev/test databases are created automatically by Hibernate.
ALTER TABLE sessions ALTER COLUMN learner_id DROP NOT NULL;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS session_type varchar(20) NOT NULL DEFAULT 'INDIVIDUAL';
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS capacity integer;

CREATE TABLE IF NOT EXISTS session_participants (
    id uuid PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES sessions(id),
    user_id uuid NOT NULL REFERENCES users(id),
    status varchar(20) NOT NULL,
    joined_at timestamp,
    CONSTRAINT uk_session_participant UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
