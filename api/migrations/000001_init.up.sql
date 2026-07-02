CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email      TEXT        NOT NULL UNIQUE,
    name       TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE decks (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID        REFERENCES decks(id) ON DELETE SET NULL,
    name        TEXT        NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cards (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    deck_id       UUID        NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    front         TEXT        NOT NULL,
    back          TEXT        NOT NULL,
    ease_factor   FLOAT       NOT NULL DEFAULT 2.5,
    interval_days INT         NOT NULL DEFAULT 0,
    repetitions   INT         NOT NULL DEFAULT 0,
    due_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE review_logs (
    id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id       UUID        NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating        INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    interval_days INT         NOT NULL,
    ease_factor   FLOAT       NOT NULL,
    response_ms   INT,
    reviewed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tags (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name    TEXT NOT NULL,
    UNIQUE(user_id, name)
);

CREATE TABLE card_tags (
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    tag_id  UUID NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (card_id, tag_id)
);

-- Speeds up the most important query in the app: fetching due cards
CREATE INDEX idx_cards_due_at  ON cards(due_at);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_decks_user_id ON decks(user_id);