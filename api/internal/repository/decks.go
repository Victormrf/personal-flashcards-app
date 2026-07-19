package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
)

type DeckRepository interface {
    FindByID(ctx context.Context, id uuid.UUID) (*domain.Deck, error)
    FindByUser(ctx context.Context, userID uuid.UUID) ([]domain.Deck, error)
    Create(ctx context.Context, deck domain.Deck) (*domain.Deck, error)
    Delete(ctx context.Context, id uuid.UUID) error
    GetCategories(ctx context.Context, userID uuid.UUID) ([]string, error)
}