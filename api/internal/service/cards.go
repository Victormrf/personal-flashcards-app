package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
)

type CardService struct {
	cards repository.CardRepository
	decks repository.DeckRepository
}

func NewCardService(cards repository.CardRepository, decks repository.DeckRepository) *CardService {
	return &CardService{cards: cards, decks: decks}
}

func (s *CardService) GetByDeck(ctx context.Context, deckID uuid.UUID) ([]domain.Card, error) {
	return s.cards.FindByDeck(ctx, deckID)
}

func (s *CardService) Create(ctx context.Context, deckID uuid.UUID, front, back string) (*domain.Card, error) {
	// Verify the deck exists before creating a card inside it
	deck, err := s.decks.FindByID(ctx, deckID)
	if err != nil {
		return nil, err
	}
	if deck == nil {
		return nil, fmt.Errorf("deck %s not found", deckID)
	}

	card := domain.Card{
		ID:     uuid.New(),
		DeckID: deckID,
		Front:  front,
		Back:   back,
	}

	return s.cards.Create(ctx, card)
}

func (s *CardService) CreateMany(ctx context.Context, deckID uuid.UUID, pairs []domain.Card) error {
    deck, err := s.decks.FindByID(ctx, deckID)
    if err != nil {
        return err
    }
    if deck == nil {
        return fmt.Errorf("deck %s not found", deckID)
    }

    cards := make([]domain.Card, len(pairs))
    for i, p := range pairs {
        cards[i] = domain.Card{
            ID:     uuid.New(),
            DeckID: deckID,
            Front:  p.Front,
            Back:   p.Back,
        }
    }

    return s.cards.CreateMany(ctx, cards)
}

func (s *CardService) Delete(ctx context.Context, id uuid.UUID) error {
	card, err := s.cards.FindByID(ctx, id)
	if err != nil {
		return err
	}
	if card == nil {
		return fmt.Errorf("card %s not found", id)
	}
	return s.cards.Delete(ctx, id)
}

func (s *CardService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Card, error) {
	card, err := s.cards.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if card == nil {
		return nil, fmt.Errorf("card %s not found", id)
	}
	return card, nil
}