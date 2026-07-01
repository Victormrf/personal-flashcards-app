package domain

import (
	"time"

	"github.com/google/uuid"
)

type Card struct {
	ID           uuid.UUID
	DeckID       uuid.UUID
	Front        string
	Back         string
	EaseFactor   float64
	IntervalDays int
	Repetitions  int
	DueAt        time.Time
	CreatedAt    time.Time
}

type Deck struct {
	ID          uuid.UUID
	UserID      uuid.UUID
	ParentID    *uuid.UUID // pointer because it's nullable
	Name        string
	Description string
	CreatedAt   time.Time
}

type ReviewLog struct {
	ID           uuid.UUID
	CardID       uuid.UUID
	UserID       uuid.UUID
	Rating       int
	IntervalDays int
	EaseFactor   float64
	ResponseMs   int
	ReviewedAt   time.Time
}

type User struct {
	ID           uuid.UUID
	Email        string
	Name         string
	PasswordHash string
	CreatedAt    time.Time
}