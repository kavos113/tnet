package server

import (
	"context"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
)

func TestBrowserImportHandlerResolveMetadata(t *testing.T) {
	testcases := []struct {
		name       string
		source     *papersv1.BrowserDetectedPaperSource
		wantTitle  string
		wantDOI    string
		wantPDFURL string
	}{
		{
			name: "uses explicit title",
			source: &papersv1.BrowserDetectedPaperSource{
				Title:  "Paper title",
				Doi:    "10.1000/example",
				PdfUrl: "https://example.test/paper.pdf",
			},
			wantTitle:  "Paper title",
			wantDOI:    "10.1000/example",
			wantPDFURL: "https://example.test/paper.pdf",
		},
		{
			name: "falls back to page title",
			source: &papersv1.BrowserDetectedPaperSource{
				PageTitle: "Page title",
			},
			wantTitle: "Page title",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &BrowserImportHandler{}

			response, err := handler.ResolveMetadata(
				context.Background(),
				connect.NewRequest(&papersv1.ResolveMetadataRequest{Source: testcase.source}),
			)
			if err != nil {
				t.Fatalf("ResolveMetadata() error = %v", err)
			}

			if response.Msg.Title != testcase.wantTitle {
				t.Fatalf("Title = %q, want %q", response.Msg.Title, testcase.wantTitle)
			}
			if response.Msg.Doi != testcase.wantDOI {
				t.Fatalf("Doi = %q, want %q", response.Msg.Doi, testcase.wantDOI)
			}
			if response.Msg.PdfUrl != testcase.wantPDFURL {
				t.Fatalf("PdfUrl = %q, want %q", response.Msg.PdfUrl, testcase.wantPDFURL)
			}
		})
	}
}
