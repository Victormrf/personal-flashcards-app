package postgres

import (
	"context"
	"database/sql"
	"errors"

	"github.com/google/uuid"
	db "github.com/Victormrf/personal-flashcards-app/db"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
)

type userRepository struct {
	q *db.Queries
}

func NewUserRepository(q *db.Queries) repository.UserRepository {
	return &userRepository{q: q}
}

func (r *userRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	row, err := r.q.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u := toDomainUser(row)
	return &u, nil
}

func (r *userRepository) FindByEmail(ctx context.Context, email string) (*domain.User, error) {
	row, err := r.q.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	u := toDomainUser(row)
	return &u, nil
}

func (r *userRepository) Create(ctx context.Context, user domain.User) (*domain.User, error) {
	row, err := r.q.CreateUser(ctx, db.CreateUserParams{
		ID:    user.ID,
		Email: user.Email,
		Name:  user.Name,
	})
	if err != nil {
		return nil, err
	}
	u := toDomainUser(row)
	return &u, nil
}

func toDomainUser(row db.User) domain.User {
	return domain.User{
		ID:        row.ID,
		Email:     row.Email,
		Name:      row.Name,
		CreatedAt: row.CreatedAt,
	}
}