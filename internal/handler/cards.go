package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/service"
)

type CardHandler struct {
	cards *service.CardService
}

func NewCardHandler(cards *service.CardService) *CardHandler {
	return &CardHandler{cards: cards}
}

type createCardRequest struct {
	Front string `json:"front"`
	Back  string `json:"back"`
}

func (h *CardHandler) Create(w http.ResponseWriter, r *http.Request) {
	deckID, err := uuid.Parse(chi.URLParam(r, "deckID"))
	if err != nil {
		writeError(w, err)
		return
	}

	var req createCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err)
		return
	}

	if req.Front == "" || req.Back == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "front and back are required",
		})
		return
	}

	card, err := h.cards.Create(r.Context(), deckID, req.Front, req.Back)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, card)
}

func (h *CardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "cardID"))
	if err != nil {
		writeError(w, err)
		return
	}

	if err := h.cards.Delete(r.Context(), id); err != nil {
		writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}