package service

import (
	"math"
	"time"
)

// CardState holds the three scheduling fields that SM-2 operates on.
// These mirror the fields on domain. Card but are isolated here
// so the algorithm has no dependency on the full Card type.
type CardState struct {
	Interval    int
	Repetitions int
	EaseFactor  float64
}

// ReviewResult is the output of ReviewCard — the new state plus the next due date.
type ReviewResult struct {
	CardState
	DueAt time.Time
}

// Rating scale:
// 1 = complete blackout
// 2 = wrong but remembered with hint
// 3 = correct but hard
// 4 = correct with hesitation
// 5 = perfect recall
//
// In the UI these map to: Again=1, Hard=3, Good=4, Easy=5

// ReviewCard applies the SM-2 algorithm and returns the updated card state.
// It is a pure function — no side effects, no DB calls, easy to test.
func ReviewCard(state CardState, rating int) ReviewResult {
	interval := state.Interval
	repetitions := state.Repetitions
	easeFactor := state.EaseFactor

	if rating >= 3 {
		// Card was remembered — grow the interval
		switch repetitions {
		case 0:
			interval = 1
		case 1:
			interval = 6
		default:
			interval = int(math.Round(float64(interval) * easeFactor))
		}
		repetitions++
	} else {
		// Card was forgotten — reset
		interval = 1
		repetitions = 0
	}

	// Adjust ease factor, clamped to minimum 1.3
	easeFactor = math.Max(
		1.3,
		easeFactor+0.1-(float64(5-rating))*(0.08+(float64(5-rating))*0.02),
	)

	return ReviewResult{
		CardState: CardState{
			Interval:    interval,
			Repetitions: repetitions,
			EaseFactor:  easeFactor,
		},
		DueAt: time.Now().AddDate(0, 0, interval),
	}
}

// InitialCardState returns the default state for a brand new card.
func InitialCardState() CardState {
	return CardState{
		Interval:    0,
		Repetitions: 0,
		EaseFactor:  2.5,
	}
}