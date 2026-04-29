package metadataresolver

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestACMResolverResolve(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/action/exportCiteProcCitation" {
			t.Fatalf("request path = %q", request.URL.Path)
		}
		body, _ := io.ReadAll(request.Body)
		if !strings.Contains(string(body), "dois=10.1145%2F3477132.3483540") {
			t.Fatalf("request body = %q", string(body))
		}
		response.Header().Set("Content-Type", "application/json")
		_, _ = response.Write([]byte(`{
			"items": [
				{
					"10.1145/3477132.3483540": {
						"title": "Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3",
						"author": [
							{"given": "James", "family": "Bornholt"},
							{"given": "Rajeev", "family": "Joshi"}
						],
						"issued": {"date-parts": [[2021, 10, 26]]},
						"container-title": "Proceedings of the ACM SIGOPS 28th Symposium on Operating Systems Principles",
						"DOI": "10.1145/3477132.3483540",
						"URL": "https://dl.acm.org/doi/10.1145/3477132.3483540"
					}
				}
			]
		}`))
	}))
	defer server.Close()

	resolver := NewACMResolverWithBaseURL(server.Client(), server.URL)
	metadata, err := resolver.Resolve(context.Background(), Source{
		SourceURL: "https://dl.acm.org/doi/10.1145/3477132.3483540",
		DOI:       "10.1145/3477132.3483540",
	})
	if err != nil {
		t.Fatalf("Resolve() error = %v", err)
	}

	if metadata.Title != "Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3" {
		t.Fatalf("Title = %q", metadata.Title)
	}
	if len(metadata.Authors) != 2 || metadata.Authors[0] != "James Bornholt" {
		t.Fatalf("Authors = %#v", metadata.Authors)
	}
	if metadata.Venue != "Proceedings of the ACM SIGOPS 28th Symposium on Operating Systems Principles" {
		t.Fatalf("Venue = %q", metadata.Venue)
	}
	if metadata.PDFURL != "https://dl.acm.org/doi/pdf/10.1145/3477132.3483540?download=true" {
		t.Fatalf("PDFURL = %q", metadata.PDFURL)
	}
}

func TestACMResolverUnsupportedNonACMSource(t *testing.T) {
	resolver := NewACMResolver(nil)
	metadata, err := resolver.Resolve(context.Background(), Source{
		SourceURL: "https://example.test/doi/10.1000/example",
		DOI:       "10.1000/example",
	})
	if err != ErrUnsupported {
		t.Fatalf("Resolve() error = %v, want ErrUnsupported", err)
	}
	if !metadata.IsZero() {
		t.Fatalf("metadata = %+v, want zero", metadata)
	}
}
