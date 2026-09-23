CREATE TABLE study_sessions (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE session_decks (
    session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    deck_id    UUID NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, deck_id)
);