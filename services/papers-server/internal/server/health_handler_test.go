package server

import (
	"context"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"go.uber.org/mock/gomock"
)

func TestHealthHandlerCheck(t *testing.T) {
	testcases := []struct {
		name        string
		status      string
		version     string
		wantStatus  string
		wantVersion string
	}{
		{
			name:        "returns service status and version",
			status:      "ok",
			version:     "test-version",
			wantStatus:  "ok",
			wantVersion: "test-version",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			mockHealthChecker := NewMockHealthChecker(ctrl)
			mockHealthChecker.EXPECT().Status().Return(testcase.status, testcase.version)

			_, handler := NewHealthHandler(mockHealthChecker)
			server := httptest.NewServer(handler)
			defer server.Close()

			client := papersv1connect.NewHealthServiceClient(server.Client(), server.URL)
			response, err := client.Check(context.Background(), connect.NewRequest(&papersv1.CheckRequest{}))
			if err != nil {
				t.Fatalf("Check() error = %v", err)
			}

			if response.Msg.Status != testcase.wantStatus {
				t.Fatalf("Status = %q, want %q", response.Msg.Status, testcase.wantStatus)
			}
			if response.Msg.Version != testcase.wantVersion {
				t.Fatalf("Version = %q, want %q", response.Msg.Version, testcase.wantVersion)
			}
		})
	}
}
