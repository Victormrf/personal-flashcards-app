package middleware

import (
	"net/http"
	"strconv"
	"time"

	"github.com/Victormrf/personal-flashcards-app/internal/metrics"
)

// responseWriter wraps http.ResponseWriter to capture the status code
type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

func PrometheusMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(wrapped, r)

		duration := time.Since(start).Seconds()
		status := strconv.Itoa(wrapped.status)

		metrics.HTTPRequestsTotal.
			WithLabelValues(r.Method, r.URL.Path, status).
			Inc()

		metrics.HTTPRequestDuration.
			WithLabelValues(r.Method, r.URL.Path).
			Observe(duration)
	})
}