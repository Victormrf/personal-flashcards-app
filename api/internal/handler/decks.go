package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/service"
)

type DeckHandler struct {
	decks *service.DeckService
}

func NewDeckHandler(decks *service.DeckService) *DeckHandler {
	return &DeckHandler{decks: decks}
}

type createDeckRequest struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (h *DeckHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(uuid.UUID)

	decks, err := h.decks.ListByUser(r.Context(), userID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, decks)
}

func (h *DeckHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(uuid.UUID)

	var req createDeckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err)
		return
	}

	if req.Name == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "name is required",
		})
		return
	}

	deck, err := h.decks.Create(r.Context(), userID, req.Name, req.Description)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusCreated, deck)
}

func (h *DeckHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "deckID"))
	if err != nil {
		writeError(w, err)
		return
	}

	if err := h.decks.Delete(r.Context(), id); err != nil {
		writeError(w, err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}