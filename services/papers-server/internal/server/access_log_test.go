package server

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestNewAccessLogHandlerWritesRequestLine(t *testing.T) {
	var output bytes.Buffer
	handler := NewAccessLogHandler(
		http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
			w.WriteHeader(http.StatusCreated)
		}),
		&output,
	)

	request := httptest.NewRequest(http.MethodPost, "/tnet.papers.v1.PaperService/ListPapers", nil)
	request.RemoteAddr = "127.0.0.1:12345"
	handler.ServeHTTP(httptest.NewRecorder(), request)

	logLine := output.String()
	for _, want := range []string{
		"method=POST",
		"path=/tnet.papers.v1.PaperService/ListPapers",
		"status=201",
		"duration_ms=",
		"remote_addr=127.0.0.1:12345",
	} {
		if !strings.Contains(logLine, want) {
			t.Fatalf("access log missing %q in %q", want, logLine)
		}
	}
}

func TestNewAccessLogHandlerDefaultsStatusToOK(t *testing.T) {
	var output bytes.Buffer
	handler := NewAccessLogHandler(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	}), &output)

	handler.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/health", nil))

	if !strings.Contains(output.String(), "status=200") {
		t.Fatalf("access log should default status to 200: %q", output.String())
	}
}
