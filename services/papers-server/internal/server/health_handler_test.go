package server

import (
	"context"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/health"
)

func TestHealthHandlerCheck(t *testing.T) {
	_, handler := NewHealthHandler(health.NewService("test-version"))
	server := httptest.NewServer(handler)
	defer server.Close()

	client := papersv1connect.NewHealthServiceClient(server.Client(), server.URL)
	response, err := client.Check(context.Background(), connect.NewRequest(&papersv1.CheckRequest{}))
	if err != nil {
		t.Fatalf("Check() error = %v", err)
	}

	if response.Msg.Status != "ok" {
		t.Fatalf("Status = %q, want ok", response.Msg.Status)
	}
	if response.Msg.Version != "test-version" {
		t.Fatalf("Version = %q, want test-version", response.Msg.Version)
	}
}
