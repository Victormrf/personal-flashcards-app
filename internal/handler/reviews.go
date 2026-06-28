package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/Victormrf/personal-flashcards-app/internal/service"
)

type ReviewHandler struct {
	reviews *service.ReviewService
}

func NewReviewHandler(reviews *service.ReviewService) *ReviewHandler {
	return &ReviewHandler{reviews: reviews}
}

type submitReviewRequest struct {
	Rating     int `json:"rating"`
	ResponseMs int `json:"response_ms"`
}

func (h *ReviewHandler) GetDueCards(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("userID").(uuid.UUID)

	// Optional deckID query param: /study?deck_id=xxx
	var deckID *uuid.UUID
	if raw := r.URL.Query().Get("deck_id"); raw != "" {
		id, err := uuid.Parse(raw)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{
				"error": "invalid deck_id",
			})
			return
		}
		deckID = &id
	}

	cards, err := h.reviews.GetDueCards(r.Context(), userID, deckID)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, cards)
}

func (h *ReviewHandler) SubmitReview(w http.ResponseWriter, r *http.Request) {
	cardID, err := uuid.Parse(chi.URLParam(r, "cardID"))
	if err != nil {
		writeError(w, err)
		return
	}

	userID := r.Context().Value("userID").(uuid.UUID)

	var req submitReviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, err)
		return
	}

	card, err := h.reviews.SubmitReview(r.Context(), cardID, userID, req.Rating, req.ResponseMs)
	if err != nil {
		writeError(w, err)
		return
	}

	writeJSON(w, http.StatusOK, card)
}