package repository

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
)

type CardRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*domain.Card, error)
	FindDue(ctx context.Context, params FindDueParams) ([]domain.Card, error)
	Create(ctx context.Context, card domain.Card) (*domain.Card, error)
	UpdateScheduling(ctx context.Context, params UpdateSchedulingParams) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type FindDueParams struct {
	UserID uuid.UUID
	DeckID *uuid.UUID // nil means all decks
	Before time.Time
	Limit  int32
}

type UpdateSchedulingParams struct {
	ID           uuid.UUID
	IntervalDays int
	Repetitions  int
	EaseFactor   float64
	DueAt        time.Time
}