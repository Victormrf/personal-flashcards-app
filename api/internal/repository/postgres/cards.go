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

type cardRepository struct {
	q *db.Queries
}

func NewCardRepository(q *db.Queries) repository.CardRepository {
	return &cardRepository{q: q}
}

func (r *cardRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.Card, error) {
	row, err := r.q.GetCardByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil // not found — return nil, not an error
		}
		return nil, err
	}
	c := toDomainCard(row)
	return &c, nil
}

func (r *cardRepository) FindByDeck(ctx context.Context, deckID uuid.UUID) ([]domain.Card, error) {
	rows, err := r.q.GetCardsByDeck(ctx, deckID)
	if err != nil {
		return nil, err
	}
	cards := make([]domain.Card, len(rows))
	for i, row := range rows {
		cards[i] = toDomainCard(row)
	}
	return cards, nil
}

func (r *cardRepository) FindDue(ctx context.Context, p repository.FindDueParams) ([]domain.Card, error) {
	var deckID uuid.NullUUID
	if p.DeckID != nil {
		deckID = uuid.NullUUID{
			UUID:  *p.DeckID,
			Valid: true,
		}
	}

	rows, err := r.q.GetDueCards(ctx, db.GetDueCardsParams{
		UserID: p.UserID,
		DueAt:  p.Before,
		Limit:  p.Limit,
		DeckID: deckID,
	})
	if err != nil {
		return nil, err
	}
	cards := make([]domain.Card, len(rows))
	for i, row := range rows {
		cards[i] = toDomainCard(row)
	}
	return cards, nil
}

func (r *cardRepository) Create(ctx context.Context, card domain.Card) (*domain.Card, error) {
	row, err := r.q.CreateCard(ctx, db.CreateCardParams{
		ID:     card.ID,
		DeckID: card.DeckID,
		Front:  card.Front,
		Back:   card.Back,
	})
	if err != nil {
		return nil, err
	}
	c := toDomainCard(row)
	return &c, nil
}

func (r *cardRepository) CreateMany(ctx context.Context, cards []domain.Card) error {
    if len(cards) == 0 {
        return nil
    }

    ids     := make([]uuid.UUID, len(cards))
    deckIDs := make([]uuid.UUID, len(cards))
    fronts  := make([]string,    len(cards))
    backs   := make([]string,    len(cards))

    for i, c := range cards {
        ids[i]     = c.ID
        deckIDs[i] = c.DeckID
        fronts[i]  = c.Front
        backs[i]   = c.Back
    }

    return r.q.CreateManyCards(ctx, db.CreateManyCardsParams{
        Column1: ids,
        Column2: deckIDs,
        Column3: fronts,
        Column4: backs,
    })
}

func (r *cardRepository) UpdateScheduling(ctx context.Context, p repository.UpdateSchedulingParams) error {
	return r.q.UpdateCardScheduling(ctx, db.UpdateCardSchedulingParams{
		ID:           p.ID,
		IntervalDays: int32(p.IntervalDays),
		Repetitions:  int32(p.Repetitions),
		EaseFactor:   p.EaseFactor,
		DueAt:        p.DueAt,
	})
}

func (r *cardRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteCard(ctx, id)
}

// toDomainCard converts a sqlc-generated db.Card into a domain.Card.
// This is the only place in the codebase that knows about both types.
func toDomainCard(row db.Card) domain.Card {
	return domain.Card{
		ID:           row.ID,
		DeckID:       row.DeckID,
		Front:        row.Front,
		Back:         row.Back,
		EaseFactor:   row.EaseFactor,
		IntervalDays: int(row.IntervalDays),
		Repetitions:  int(row.Repetitions),
		DueAt:        row.DueAt,
		CreatedAt:    row.CreatedAt,
	}
}