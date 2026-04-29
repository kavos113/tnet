package metadataresolver

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCrossrefResolverResolve(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.URL.Path != "/works/10.1145/3477132.3483540" {
			t.Fatalf("request path = %q", request.URL.Path)
		}
		response.Header().Set("Content-Type", "application/json")
		_, _ = response.Write([]byte(`{
			"message": {
				"title": ["Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3"],
				"author": [
					{"given": "James", "family": "Bornholt"},
					{"given": "Rajeev", "family": "Joshi"}
				],
				"published": {"date-parts": [[2021, 10, 26]]},
				"container-title": ["Proceedings of the ACM SIGOPS 28th Symposium on Operating Systems Principles"],
				"DOI": "10.1145/3477132.3483540",
				"URL": "https://dl.acm.org/doi/10.1145/3477132.3483540",
				"link": [
					{"URL": "https://dl.acm.org/doi/10.1145/3477132.3483540", "content-type": "unspecified"},
					{"URL": "https://dl.acm.org/doi/pdf/10.1145/3477132.3483540", "content-type": "application/pdf"}
				]
			}
		}`))
	}))
	defer server.Close()

	resolver := NewCrossrefResolverWithBaseURL(server.Client(), server.URL)
	metadata, err := resolver.Resolve(context.Background(), Source{DOI: "10.1145/3477132.3483540"})
	if err != nil {
		t.Fatalf("Resolve() error = %v", err)
	}

	if metadata.Title != "Using Lightweight Formal Methods to Validate a Key-Value Storage Node in Amazon S3" {
		t.Fatalf("Title = %q", metadata.Title)
	}
	if len(metadata.Authors) != 2 || metadata.Authors[0] != "James Bornholt" {
		t.Fatalf("Authors = %#v", metadata.Authors)
	}
	if metadata.PublishedYear != 2021 {
		t.Fatalf("PublishedYear = %d, want 2021", metadata.PublishedYear)
	}
	if metadata.PDFURL != "https://dl.acm.org/doi/pdf/10.1145/3477132.3483540" {
		t.Fatalf("PDFURL = %q", metadata.PDFURL)
	}
}
