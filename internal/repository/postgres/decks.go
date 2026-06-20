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

type deckRepository struct {
	q *db.Queries
}

func NewDeckRepository(q *db.Queries) repository.DeckRepository {
	return &deckRepository{q: q}
}

func (r *deckRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Deck, error) {
	row, err := r.q.GetDeckByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	d := toDomainDeck(row)
	return &d, nil
}

func (r *deckRepository) FindByUser(ctx context.Context, userID uuid.UUID) ([]domain.Deck, error) {
	rows, err := r.q.GetDecksByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	decks := make([]domain.Deck, len(rows))
	for i, row := range rows {
		decks[i] = toDomainDeck(row)
	}
	return decks, nil
}

func (r *deckRepository) Create(ctx context.Context, deck domain.Deck) (*domain.Deck, error) {
	row, err := r.q.CreateDeck(ctx, db.CreateDeckParams{
		ID:     deck.ID,
		UserID: deck.UserID,
		Name:   deck.Name,
	})
	if err != nil {
		return nil, err
	}
	d := toDomainDeck(row)
	return &d, nil
}

func (r *deckRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteDeck(ctx, id)
}

func toDomainDeck(row db.Deck) domain.Deck {
	return domain.Deck{
		ID:        row.ID,
		UserID:    row.UserID,
		Name:      row.Name,
		CreatedAt: row.CreatedAt,
	}
}