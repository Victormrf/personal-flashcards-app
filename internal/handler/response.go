package handler

import (
	"encoding/json"
	"net/http"

	"github.com/Victormrf/personal-flashcards-app/internal/apperror"
)

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*apperror.AppError); ok {
		writeJSON(w, appErr.Code, map[string]string{"error": appErr.Message})
		return
	}
	writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal server error"})
}