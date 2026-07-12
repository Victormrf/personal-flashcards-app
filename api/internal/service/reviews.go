package service

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
	"strconv"
	
	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/cache"
	"github.com/Victormrf/personal-flashcards-app/internal/domain"
	"github.com/Victormrf/personal-flashcards-app/internal/repository"
	"github.com/Victormrf/personal-flashcards-app/internal/metrics"
)

type ReviewService struct {
	cards   repository.CardRepository
	reviews repository.ReviewRepository
	cache   *cache.RedisCache
}

func NewReviewService(
	cards repository.CardRepository,
	reviews repository.ReviewRepository,
	cache *cache.RedisCache,
) *ReviewService {
	return &ReviewService{cards: cards, reviews: reviews, cache: cache}
}

func dueCacheKey(userID uuid.UUID) string {
	return fmt.Sprintf("due_cards:%s", userID)
}

func (s *ReviewService) GetDueCards(ctx context.Context, userID uuid.UUID, deckID *uuid.UUID) ([]domain.Card, error) {
	// Only cache the all-decks query — per-deck queries are less frequent
	if deckID == nil {
		key := dueCacheKey(userID)

		cached, err := s.cache.Get(ctx, key)
		if err == nil {
			// Cache hit — deserialize and return
			var cards []domain.Card
			if err := json.Unmarshal([]byte(cached), &cards); err == nil {
				return cards, nil
			}
		}

		// Cache miss — query the database
		cards, err := s.cards.FindDue(ctx, repository.FindDueParams{
			UserID: userID,
			DeckID: nil,
			Before: time.Now(),
			Limit:  20,
		})
		if err != nil {
			return nil, err
		}

		// Write to cache with 5 minute TTL
		if data, err := json.Marshal(cards); err == nil {
			s.cache.Set(ctx, key, string(data), 5*time.Minute)
		}

		return cards, nil
	}

	// Per-deck query — skip cache, always fresh
	return s.cards.FindDue(ctx, repository.FindDueParams{
		UserID: userID,
		DeckID: deckID,
		Before: time.Now(),
		Limit:  20,
	})
}

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

	// Increment the reviews counter labelled by rating
	metrics.CardsReviewedTotal.WithLabelValues(strconv.Itoa(rating)).Inc()

	// Invalidate the due cards cache for this user
	s.cache.Delete(ctx, dueCacheKey(userID))

	card.IntervalDays = result.Interval
	card.Repetitions = result.Repetitions
	card.EaseFactor = result.EaseFactor
	card.DueAt = result.DueAt

	// 6. Return the updated card
	return card, nil
}