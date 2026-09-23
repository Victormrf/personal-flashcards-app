package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Victormrf/personal-flashcards-app/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type SessionHandler struct {
	sessions *service.SessionService
}

func NewSessionHandler(sessions *service.SessionService) *SessionHandler {
	return &SessionHandler{sessions: sessions}
}

type createSessionRequest struct {
	Name    string   `json:"name"`
	DeckIDs []string `json:"deck_ids"`
}

func (h *SessionHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(uuid.UUID)

	var req createSessionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err)
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "name is required"})
		return
	}

	deckIDs := make([]uuid.UUID, 0, len(req.DeckIDs))
	for _, id := range req.DeckIDs {
		parsed, err := uuid.Parse(id)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid deck_id: " + id})
			return
		}
		deckIDs = append(deckIDs, parsed)
	}

	session, err := h.sessions.Create(r.Context(), userID, req.Name, deckIDs)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, session)
}

func (h *SessionHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(uuid.UUID)

	sessions, err := h.sessions.ListByUser(r.Context(), userID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, sessions)
}

func (h *SessionHandler) GetDueCards(w http.ResponseWriter, r *http.Request) {
	sessionID, err := uuid.Parse(chi.URLParam(r, "sessionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid session_id"})
		return
	}

	cards, err := h.sessions.GetDueCards(r.Context(), sessionID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, cards)
}

func (h *SessionHandler) Delete(w http.ResponseWriter, r *http.Request) {
	sessionID, err := uuid.Parse(chi.URLParam(r, "sessionID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid session_id"})
		return
	}

	if err := h.sessions.Delete(r.Context(), sessionID); err != nil {
		writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
