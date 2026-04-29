package server

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/metadataresolver"
)

type fakeMetadataResolver struct {
	metadata metadataresolver.Metadata
	err      error
}

func (resolver fakeMetadataResolver) Resolve(
	context.Context,
	metadataresolver.Source,
) (metadataresolver.Metadata, error) {
	return resolver.metadata, resolver.err
}

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

func TestBrowserImportHandlerResolveMetadataUsesResolver(t *testing.T) {
	handler := &BrowserImportHandler{
		resolver: fakeMetadataResolver{
			metadata: metadataresolver.Metadata{
				Title:         "Resolved title",
				Authors:       []string{"Alice", "Bob"},
				Abstract:      "Resolved abstract",
				PublishedYear: 2024,
				Venue:         "Conference",
				DOI:           "10.1000/resolved",
				PDFURL:        "https://example.test/paper.pdf",
			},
		},
	}

	response, err := handler.ResolveMetadata(
		context.Background(),
		connect.NewRequest(&papersv1.ResolveMetadataRequest{Source: &papersv1.BrowserDetectedPaperSource{
			SourceUrl: "https://example.test/doi/10.1000/resolved",
			Doi:       "10.1000/resolved",
		}}),
	)
	if err != nil {
		t.Fatalf("ResolveMetadata() error = %v", err)
	}

	if response.Msg.Title != "Resolved title" {
		t.Fatalf("Title = %q, want resolved title", response.Msg.Title)
	}
	if len(response.Msg.Authors) != 2 || response.Msg.Authors[0] != "Alice" {
		t.Fatalf("Authors = %#v, want resolver authors", response.Msg.Authors)
	}
	if response.Msg.PublishedYear != 2024 {
		t.Fatalf("PublishedYear = %d, want 2024", response.Msg.PublishedYear)
	}
	if response.Msg.PdfUrl != "https://example.test/paper.pdf" {
		t.Fatalf("PdfUrl = %q, want resolver pdf", response.Msg.PdfUrl)
	}
}

func TestBrowserImportHandlerResolveMetadataKeepsPageMetadata(t *testing.T) {
	handler := &BrowserImportHandler{
		resolver: fakeMetadataResolver{
			metadata: metadataresolver.Metadata{
				Title:   "Resolved title",
				Authors: []string{"Resolved Author"},
				Venue:   "Resolved venue",
			},
		},
	}

	response, err := handler.ResolveMetadata(
		context.Background(),
		connect.NewRequest(&papersv1.ResolveMetadataRequest{Source: &papersv1.BrowserDetectedPaperSource{
			Title:   "Page title",
			Authors: []string{"Page Author"},
			Venue:   "Page venue",
		}}),
	)
	if err != nil {
		t.Fatalf("ResolveMetadata() error = %v", err)
	}

	if response.Msg.Title != "Page title" {
		t.Fatalf("Title = %q, want page title", response.Msg.Title)
	}
	if response.Msg.Authors[0] != "Page Author" {
		t.Fatalf("Authors = %#v, want page authors", response.Msg.Authors)
	}
	if response.Msg.Venue != "Page venue" {
		t.Fatalf("Venue = %q, want page venue", response.Msg.Venue)
	}
}

func TestBrowserImportHandlerResolveMetadataIgnoresResolverError(t *testing.T) {
	handler := &BrowserImportHandler{
		resolver: fakeMetadataResolver{err: errors.New("resolver unavailable")},
	}

	response, err := handler.ResolveMetadata(
		context.Background(),
		connect.NewRequest(&papersv1.ResolveMetadataRequest{Source: &papersv1.BrowserDetectedPaperSource{
			PageTitle: "Fallback title",
			Doi:       "10.1000/fallback",
		}}),
	)
	if err != nil {
		t.Fatalf("ResolveMetadata() error = %v", err)
	}

	if response.Msg.Title != "Fallback title" {
		t.Fatalf("Title = %q, want fallback title", response.Msg.Title)
	}
	if response.Msg.Doi != "10.1000/fallback" {
		t.Fatalf("Doi = %q, want source DOI", response.Msg.Doi)
	}
}
