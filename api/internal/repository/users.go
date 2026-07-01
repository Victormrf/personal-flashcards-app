package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
)

type UserRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error)
	FindByEmail(ctx context.Context, email string) (*domain.User, error)
	Create(ctx context.Context, user domain.User) (*domain.User, error)
}