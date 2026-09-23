package postgres

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	db "github.com/Victormrf/personal-flashcards-app/db"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
	"github.com/google/uuid"
	"github.com/lib/pq"
)

type sessionRepository struct {
	q *db.Queries
}

func NewSessionRepository(q *db.Queries) repository.SessionRepository {
	return &sessionRepository{q: q}
}

func (r *sessionRepository) Create(ctx context.Context, s domain.StudySession) (*domain.StudySession, error) {
	row, err := r.q.CreateStudySession(ctx, db.CreateStudySessionParams{
		ID:     s.ID,
		UserID: s.UserID,
		Name:   s.Name,
	})
	if err != nil {
		return nil, err
	}

	// Add all decks in the same operation
	for _, deckID := range s.DeckIDs {
		if err := r.q.AddDeckToSession(ctx, db.AddDeckToSessionParams{
			SessionID: row.ID,
			DeckID:    deckID,
		}); err != nil {
			return nil, err
		}
	}

	result := domain.StudySession{
		ID:        row.ID,
		UserID:    row.UserID,
		Name:      row.Name,
		DeckIDs:   s.DeckIDs,
		CreatedAt: row.CreatedAt,
	}
	return &result, nil
}

func (r *sessionRepository) FindByUser(ctx context.Context, userID uuid.UUID) ([]domain.StudySession, error) {
	rows, err := r.q.GetStudySessionsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	sessions := make([]domain.StudySession, len(rows))
	for i, row := range rows {
		sessions[i], err = toDomainSession(row.ID, row.UserID, row.Name, row.CreatedAt, row.DeckIds)
		if err != nil {
			return nil, err
		}
	}
	return sessions, nil
}

func (r *sessionRepository) FindByID(ctx context.Context, id uuid.UUID) (*domain.StudySession, error) {
	row, err := r.q.GetStudySessionByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	s, err := toDomainSession(row.ID, row.UserID, row.Name, row.CreatedAt, row.DeckIds)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *sessionRepository) AddDeck(ctx context.Context, sessionID, deckID uuid.UUID) error {
	return r.q.AddDeckToSession(ctx, db.AddDeckToSessionParams{
		SessionID: sessionID,
		DeckID:    deckID,
	})
}

func (r *sessionRepository) RemoveDeck(ctx context.Context, sessionID, deckID uuid.UUID) error {
	return r.q.RemoveDeckFromSession(ctx, db.RemoveDeckFromSessionParams{
		SessionID: sessionID,
		DeckID:    deckID,
	})
}

func (r *sessionRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.q.DeleteStudySession(ctx, id)
}

func toDomainSession(id, userID uuid.UUID, name string, createdAt time.Time, deckIDs interface{}) (domain.StudySession, error) {
	ids := make([]uuid.UUID, 0)
	if deckIDs != nil {
		var rawIDs pq.StringArray
		if err := rawIDs.Scan(deckIDs); err != nil {
			return domain.StudySession{}, fmt.Errorf("scan deck IDs for session %s: %w", id, err)
		}
		for _, rawID := range rawIDs {
			deckID, err := uuid.Parse(rawID)
			if err != nil {
				return domain.StudySession{}, fmt.Errorf("parse deck ID for session %s: %w", id, err)
			}
			ids = append(ids, deckID)
		}
	}
	return domain.StudySession{
		ID:        id,
		UserID:    userID,
		Name:      name,
		DeckIDs:   ids,
		CreatedAt: createdAt,
	}, nil
}
