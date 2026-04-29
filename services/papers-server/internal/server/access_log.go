package server

import (
	"fmt"
	"io"
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

func NewAccessLogHandler(next http.Handler, output io.Writer) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startedAt := time.Now()
		statusWriter := &responseStatusWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		next.ServeHTTP(statusWriter, r)

		_, _ = fmt.Fprintf(
			output,
			"%s method=%s path=%s status=%d duration_ms=%d remote_addr=%s\n",
			startedAt.Format(time.RFC3339),
			r.Method,
			r.URL.Path,
			statusWriter.statusCode,
			time.Since(startedAt).Milliseconds(),
			r.RemoteAddr,
		)
	})
}
