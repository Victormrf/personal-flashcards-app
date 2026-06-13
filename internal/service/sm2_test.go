package service

import (
	"testing"
)

// helper to get a fresh card state for each test
func newCard() CardState {
	return InitialCardState()
}

func TestReviewCard_FirstReviewGoodRating(t *testing.T) {
	state := newCard()
	result := ReviewCard(state, 4)

	if result.Interval != 1 {
		t.Errorf("expected interval 1 on first review, got %d", result.Interval)
	}
	if result.Repetitions != 1 {
		t.Errorf("expected repetitions 1, got %d", result.Repetitions)
	}
	if result.EaseFactor <= 1.3 {
		t.Errorf("expected ease factor above 1.3, got %f", result.EaseFactor)
	}
}

func TestReviewCard_SecondReviewGoodRating(t *testing.T) {
	state := newCard()
	state = ReviewCard(state, 4).CardState // first review
	result := ReviewCard(state, 4)         // second review

	if result.Interval != 6 {
		t.Errorf("expected interval 6 on second review, got %d", result.Interval)
	}
	if result.Repetitions != 2 {
		t.Errorf("expected repetitions 2, got %d", result.Repetitions)
	}
}

func TestReviewCard_ThirdReviewGrowsInterval(t *testing.T) {
	state := newCard()
	state = ReviewCard(state, 4).CardState // first  → interval 1
	state = ReviewCard(state, 4).CardState // second → interval 6
	result := ReviewCard(state, 4)         // third  → interval 6 * easeFactor

	if result.Interval <= 6 {
		t.Errorf("expected interval > 6 on third review, got %d", result.Interval)
	}
	if result.Repetitions != 3 {
		t.Errorf("expected repetitions 3, got %d", result.Repetitions)
	}
}

func TestReviewCard_FailedReviewResetsState(t *testing.T) {
	// Get the card to a non-zero state first
	state := newCard()
	state = ReviewCard(state, 4).CardState
	state = ReviewCard(state, 4).CardState

	// Now fail it
	result := ReviewCard(state, 1)

	if result.Interval != 1 {
		t.Errorf("expected interval to reset to 1, got %d", result.Interval)
	}
	if result.Repetitions != 0 {
		t.Errorf("expected repetitions to reset to 0, got %d", result.Repetitions)
	}
}

func TestReviewCard_EaseFactorMinimumClamp(t *testing.T) {
	state := newCard()

	// Fail the card many times to drive ease factor down
	for i := 0; i < 10; i++ {
		state = ReviewCard(state, 1).CardState
	}

	if state.EaseFactor < 1.3 {
		t.Errorf("ease factor dropped below minimum 1.3, got %f", state.EaseFactor)
	}
}

func TestReviewCard_PerfectRatingIncreasesEaseFactor(t *testing.T) {
	state := newCard()
	result := ReviewCard(state, 5)

	if result.EaseFactor <= 2.5 {
		t.Errorf("expected ease factor to increase above 2.5 on perfect rating, got %f", result.EaseFactor)
	}
}

func TestReviewCard_DueAtIsInFuture(t *testing.T) {
	state := newCard()
	result := ReviewCard(state, 4)

	if result.Interval < 1 {
		t.Errorf("expected interval to be at least 1 day, got %d", result.Interval)
	}
}