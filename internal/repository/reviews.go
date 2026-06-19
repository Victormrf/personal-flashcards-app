package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
)

type ReviewRepository interface {
	Create(ctx context.Context, log domain.ReviewLog) error
	FindByUser(ctx context.Context, userID uuid.UUID, limit int32) ([]domain.ReviewLog, error)
}