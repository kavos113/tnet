package app

import (
	"context"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
)

func TestContainerRegistersHandlersAndCloses(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "health handler is registered"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			container, err := NewContainer(ContainerOptions{UserDataDir: t.TempDir()})
			if err != nil {
				t.Fatalf("NewContainer() error = %v", err)
			}
			defer func() {
				if err := container.Close(); err != nil {
					t.Fatalf("Close() error = %v", err)
				}
			}()

			server := httptest.NewServer(container.Handler())
			defer server.Close()

			client := papersv1connect.NewHealthServiceClient(server.Client(), server.URL)
			response, err := client.Check(context.Background(), connect.NewRequest(&papersv1.CheckRequest{}))
			if err != nil {
				t.Fatalf("Check() error = %v", err)
			}
			if response.Msg.Status != "ok" || response.Msg.Version == "" {
				t.Fatalf("Check() = %+v, want ok response with version", response.Msg)
			}
		})
	}
}
