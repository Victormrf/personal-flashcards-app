package repository

import (
    "context"

    "github.com/google/uuid"
    "github.com/Victormrf/personal-flashcards-app/internal/domain"
)

type SessionRepository interface {
    Create(ctx context.Context, session domain.StudySession) (*domain.StudySession, error)
    FindByUser(ctx context.Context, userID uuid.UUID) ([]domain.StudySession, error)
    FindByID(ctx context.Context, id uuid.UUID) (*domain.StudySession, error)
    AddDeck(ctx context.Context, sessionID, deckID uuid.UUID) error
    RemoveDeck(ctx context.Context, sessionID, deckID uuid.UUID) error
    Delete(ctx context.Context, id uuid.UUID) error
    UpdateName(ctx context.Context, id uuid.UUID, name string) error
    ReplaceDecks(ctx context.Context, id uuid.UUID, deckIDs []uuid.UUID) error
}