package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
)

type ReviewService struct {
	cards   repository.CardRepository
	reviews repository.ReviewRepository
}

func NewReviewService(cards repository.CardRepository, reviews repository.ReviewRepository) *ReviewService {
	return &ReviewService{cards: cards, reviews: reviews}
}

// GetDueCards returns all cards due for review for a given user.
// An optional deckID filters to a specific deck — nil means all decks.
func (s *ReviewService) GetDueCards(ctx context.Context, userID uuid.UUID, deckID *uuid.UUID) ([]domain.Card, error) {
	return s.cards.FindDue(ctx, repository.FindDueParams{
		UserID: userID,
		DeckID: deckID,
		Before: time.Now(),
		Limit:  20,
	})
}

// SubmitReview applies the SM-2 algorithm to a card and persists
// both the updated scheduling state and the review log entry.
func (s *ReviewService) SubmitReview(
	ctx context.Context,
	cardID uuid.UUID,
	userID uuid.UUID,
	rating int,
	responseMs int,
) (*domain.Card, error) {
	// 1. Fetch the current card state
	card, err := s.cards.FindByID(ctx, cardID)
	if err != nil {
		return nil, err
	}
	if card == nil {
		return nil, fmt.Errorf("card %s not found", cardID)
	}

	// 2. Validate rating is within the accepted range
	if rating < 1 || rating > 5 {
		return nil, fmt.Errorf("rating must be between 1 and 5, got %d", rating)
	}

	// 3. Run SM-2 algorithm
	result := ReviewCard(CardState{
		Interval:    card.IntervalDays,
		Repetitions: card.Repetitions,
		EaseFactor:  card.EaseFactor,
	}, rating)

	// 4. Persist the updated scheduling fields on the card
	err = s.cards.UpdateScheduling(ctx, repository.UpdateSchedulingParams{
		ID:           cardID,
		IntervalDays: result.Interval,
		Repetitions:  result.Repetitions,
		EaseFactor:   result.EaseFactor,
		DueAt:        result.DueAt,
	})
	if err != nil {
		return nil, err
	}

	// 5. Persist the review log for analytics
	err = s.reviews.Create(ctx, domain.ReviewLog{
		ID:           uuid.New(),
		CardID:       cardID,
		UserID:       userID,
		Rating:       rating,
		IntervalDays: result.Interval,
		EaseFactor:   result.EaseFactor,
		ResponseMs:   responseMs,
		ReviewedAt:   time.Now(),
	})
	if err != nil {
		return nil, err
	}

	// 6. Return the updated card
	card.IntervalDays = result.Interval
	card.Repetitions = result.Repetitions
	card.EaseFactor = result.EaseFactor
	card.DueAt = result.DueAt

	return card, nil
}