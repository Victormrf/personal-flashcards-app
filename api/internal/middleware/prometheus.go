package middleware

import (
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/Victormrf/personal-flashcards-app/internal/metrics"
)

// matches UUIDs in URL paths
var uuidRegex = regexp.MustCompile(`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)

func normalizePath(path string) string {
	return uuidRegex.ReplaceAllString(path, ":id")
}

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
		path := normalizePath(r.URL.Path)

		metrics.HTTPRequestsTotal.
			WithLabelValues(r.Method, path, status).
			Inc()

		metrics.HTTPRequestDuration.
			WithLabelValues(r.Method, path).
			Observe(duration)
	})
}