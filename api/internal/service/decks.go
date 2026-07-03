package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
)

type DeckService struct {
	decks repository.DeckRepository
}

func NewDeckService(decks repository.DeckRepository) *DeckService {
	return &DeckService{decks: decks}
}

func (s *DeckService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Deck, error) {
	deck, err := s.decks.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if deck == nil {
		return nil, fmt.Errorf("deck %s not found", id)
	}
	return deck, nil
}

func (s *DeckService) Create(ctx context.Context, userID uuid.UUID, name, description string) (*domain.Deck, error) {
	deck := domain.Deck{
		ID:          uuid.New(),
		UserID:      userID,
		Name:        name,
		Description: description,
	}
	return s.decks.Create(ctx, deck)
}

func (s *DeckService) ListByUser(ctx context.Context, userID uuid.UUID) ([]domain.Deck, error) {
	return s.decks.FindByUser(ctx, userID)
}

func (s *DeckService) Delete(ctx context.Context, id uuid.UUID) error {
	deck, err := s.decks.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if deck == nil {
		return fmt.Errorf("deck %s not found", id)
	}
	return s.decks.Delete(ctx, id)
}