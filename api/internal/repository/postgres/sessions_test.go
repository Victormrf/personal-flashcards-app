package postgres

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestToDomainSession(t *testing.T) {
	sessionID := uuid.New()
	userID := uuid.New()
	deckID := uuid.New()
	createdAt := time.Date(2026, time.September, 22, 21, 45, 0, 0, time.UTC)

	session, err := toDomainSession(sessionID, userID, "Review", createdAt, []byte("{"+deckID.String()+"}"))
	if err != nil {
		t.Fatal(err)
	}
	if session.ID != sessionID || session.UserID != userID || session.Name != "Review" {
		t.Fatalf("unexpected session fields: %+v", session)
	}
	if len(session.DeckIDs) != 1 || session.DeckIDs[0] != deckID {
		t.Fatalf("unexpected deck IDs: %v", session.DeckIDs)
	}
	if !session.CreatedAt.Equal(createdAt) {
		t.Fatalf("unexpected creation time: %v", session.CreatedAt)
	}

	empty, err := toDomainSession(sessionID, userID, "Empty", createdAt, nil)
	if err != nil {
		t.Fatal(err)
	}
	if empty.DeckIDs == nil || len(empty.DeckIDs) != 0 {
		t.Fatalf("expected an empty deck ID array, got %v", empty.DeckIDs)
	}
}
