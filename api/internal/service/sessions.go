package service

import (
	"context"
	"fmt"
	"time"

	"github.com/Victormrf/personal-flashcards-app/internal/apperror"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
	"github.com/google/uuid"
)

type SessionService struct {
	sessions repository.SessionRepository
	cards    repository.CardRepository
}

func NewSessionService(sessions repository.SessionRepository, cards repository.CardRepository) *SessionService {
	return &SessionService{sessions: sessions, cards: cards}
}

func (s *SessionService) Create(ctx context.Context, userID uuid.UUID, name string, deckIDs []uuid.UUID) (*domain.StudySession, error) {
	if len(deckIDs) == 0 {
		return nil, apperror.BadRequest("a study session must include at least one deck")
	}

	session := domain.StudySession{
		ID:      uuid.New(),
		UserID:  userID,
		Name:    name,
		DeckIDs: deckIDs,
	}
	return s.sessions.Create(ctx, session)
}

func (s *SessionService) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.StudySession, error) {
	return s.sessions.FindByUser(ctx, userID)
}

func (s *SessionService) GetDueCards(ctx context.Context, sessionID uuid.UUID) ([]domain.Card, error) {
	session, err := s.sessions.FindByID(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session == nil {
		return nil, apperror.NotFound(fmt.Sprintf("session %s not found", sessionID))
	}

	return s.cards.FindDueByDecks(ctx, repository.FindDueByDecksParams{
		DeckIDs: session.DeckIDs,
		Before:  time.Now(),
		Limit:   50, // higher limit for sessions — more decks, more cards
	})
}

func (s *SessionService) Delete(ctx context.Context, id uuid.UUID) error {
	session, err := s.sessions.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if session == nil {
		return apperror.NotFound(fmt.Sprintf("session %s not found", id))
	}
	return s.sessions.Delete(ctx, id)
}
