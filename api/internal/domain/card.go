package domain

import (
	"time"

	"github.com/google/uuid"
)

type Card struct {
	ID           uuid.UUID `json:"id"`
	DeckID       uuid.UUID `json:"deck_id"`
	Front        string    `json:"front"`
	Back         string    `json:"back"`
	EaseFactor   float64   `json:"ease_factor"`
	IntervalDays int       `json:"interval_days"`
	Repetitions  int       `json:"repetitions"`
	DueAt        time.Time `json:"due_at"`
	CreatedAt    time.Time `json:"created_at"`
}

type Deck struct {
	ID          uuid.UUID  `json:"id"`
	UserID      uuid.UUID  `json:"user_id"`
	ParentID    *uuid.UUID `json:"parent_id,omitempty"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
}

type ReviewLog struct {
	ID           uuid.UUID `json:"id"`
	CardID       uuid.UUID `json:"card_id"`
	UserID       uuid.UUID `json:"user_id"`
	Rating       int       `json:"rating"`
	IntervalDays int       `json:"interval_days"`
	EaseFactor   float64   `json:"ease_factor"`
	ResponseMs   int       `json:"response_ms"`
	ReviewedAt   time.Time `json:"reviewed_at"`
}

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}