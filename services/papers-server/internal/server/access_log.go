package server

import (
	"log/slog"
	"net/http"
	"time"
)

type responseStatusWriter struct {
	http.ResponseWriter
	statusCode int
}

func (writer *responseStatusWriter) WriteHeader(statusCode int) {
	writer.statusCode = statusCode
	writer.ResponseWriter.WriteHeader(statusCode)
}

func (writer *responseStatusWriter) Unwrap() http.ResponseWriter {
	return writer.ResponseWriter
}

func (writer *responseStatusWriter) Flush() {
	flusher, ok := writer.ResponseWriter.(http.Flusher)
	if ok {
		flusher.Flush()
	}
}

func NewAccessLogHandler(next http.Handler, logger *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		statusWriter := &responseStatusWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(statusWriter, r)

		logger.Info(
			"http request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", statusWriter.statusCode,
			"duration_ms", time.Since(startedAt).Milliseconds(),
			"remote_addr", r.RemoteAddr,
		)
	})
}
