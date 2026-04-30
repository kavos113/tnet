package server

import (
	"bytes"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNewAccessLogHandlerWritesRequestLine(t *testing.T) {
	var output bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&output, nil))
	handler := NewAccessLogHandler(
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
		}),
		logger,
	)

	request := httptest.NewRequest(http.MethodPost, "/tnet.papers.v1.PaperService/ListPapers", nil)
	request.RemoteAddr = "127.0.0.1:12345"
	handler.ServeHTTP(httptest.NewRecorder(), request)

	logLine := output.String()
	for _, want := range []string{
		"msg=\"http request\"",
		"method=POST",
		"path=/tnet.papers.v1.PaperService/ListPapers",
		"status=201",
		"duration_ms=",
		"remote_addr=127.0.0.1:12345",
		"request_id=",
	} {
		if !strings.Contains(logLine, want) {
			t.Fatalf("access log missing %q in %q", want, logLine)
		}
	}
}

func TestNewAccessLogHandlerPreservesRequestID(t *testing.T) {
	var output bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&output, nil))
	handler := NewAccessLogHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	}), logger)
	request := httptest.NewRequest(http.MethodGet, "/health", nil)
	request.Header.Set("X-Request-Id", "request-1")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Header().Get("X-Request-Id") != "request-1" {
		t.Fatalf("response request id = %q, want request-1", recorder.Header().Get("X-Request-Id"))
	}
	if !strings.Contains(output.String(), "request_id=request-1") {
		t.Fatalf("access log should include request id: %q", output.String())
	}
}

func TestNewAccessLogHandlerDefaultsStatusToOK(t *testing.T) {
	var output bytes.Buffer
	logger := slog.New(slog.NewTextHandler(&output, nil))
	handler := NewAccessLogHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	}), logger)

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/health", nil))

	if !strings.Contains(output.String(), "status=200") {
		t.Fatalf("access log should default status to 200: %q", output.String())
	}
}

func TestResponseStatusWriterPreservesFlusher(t *testing.T) {
	recorder := httptest.NewRecorder()
	writer := &responseStatusWriter{ResponseWriter: recorder}

	flusher, ok := interface{}(writer).(http.Flusher)
	if !ok {
		t.Fatal("responseStatusWriter should implement http.Flusher")
	}

	flusher.Flush()
	if !recorder.Flushed {
		t.Fatal("Flush() should forward to the wrapped response writer")
	}
}
