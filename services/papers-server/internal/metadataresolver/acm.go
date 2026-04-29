package metadataresolver

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
)

const defaultACMBaseURL = "https://dl.acm.org"

type ACMResolver struct {
	httpClient *http.Client
	baseURL    string
}

func NewACMResolver(httpClient *http.Client) *ACMResolver {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &ACMResolver{
		httpClient: httpClient,
		baseURL:    defaultACMBaseURL,
	}
}

func NewACMResolverWithBaseURL(httpClient *http.Client, baseURL string) *ACMResolver {
	resolver := NewACMResolver(httpClient)
	resolver.baseURL = strings.TrimRight(baseURL, "/")
	return resolver
}

func (resolver *ACMResolver) Resolve(ctx context.Context, source Source) (Metadata, error) {
	if source.DOI == "" || !strings.Contains(strings.ToLower(source.SourceURL), "dl.acm.org") {
		return Metadata{}, ErrUnsupported
	}

	form := url.Values{}
	form.Set("targetFile", "custom-bibtex")
	form.Set("format", "bibTex")
	form.Set("dois", source.DOI)

	endpoint := resolver.baseURL + "/action/exportCiteProcCitation"
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewBufferString(form.Encode()))
	if err != nil {
		return Metadata{}, err
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "tnet-papers-server/0.1")

	response, err := resolver.httpClient.Do(request)
	if err != nil {
		return Metadata{}, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return Metadata{}, fmt.Errorf("acm returned status %d", response.StatusCode)
	}

	var payload acmResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return Metadata{}, err
	}
	if len(payload.Items) == 0 {
		return Metadata{}, nil
	}
	item := payload.Items[0][source.DOI]
	if item.Title == "" {
		for _, candidate := range payload.Items[0] {
			item = candidate
			break
		}
	}

	return Metadata{
		Title:         item.Title,
		Authors:       cslAuthors(item.Author),
		Abstract:      item.Abstract,
		PublishedYear: cslYear(item.Issued),
		Venue:         firstNonEmpty(item.ContainerTitle, item.CollectionTitle, item.Publisher),
		DOI:           firstNonEmpty(item.DOI, source.DOI),
		URL:           firstNonEmpty(item.URL, "https://dl.acm.org/doi/"+source.DOI),
		PDFURL:        "https://dl.acm.org/doi/pdf/" + source.DOI + "?download=true",
	}, nil
}

type acmResponse struct {
	Items []map[string]cslItem `json:"items"`
}

type cslItem struct {
	Title           string      `json:"title"`
	Author          []cslAuthor `json:"author"`
	Abstract        string      `json:"abstract"`
	ContainerTitle  string      `json:"container-title"`
	CollectionTitle string      `json:"collection-title"`
	Publisher       string      `json:"publisher"`
	DOI             string      `json:"DOI"`
	URL             string      `json:"URL"`
	Issued          cslDate     `json:"issued"`
}

type cslAuthor struct {
	Given   string `json:"given"`
	Family  string `json:"family"`
	Literal string `json:"literal"`
}

type cslDate struct {
	DateParts [][]int `json:"date-parts"`
	Raw       string  `json:"raw"`
}

func cslAuthors(authors []cslAuthor) []string {
	result := make([]string, 0, len(authors))
	for _, author := range authors {
		name := strings.TrimSpace(author.Literal)
		if name == "" {
			name = strings.TrimSpace(strings.TrimSpace(author.Given) + " " + strings.TrimSpace(author.Family))
		}
		if name != "" {
			result = append(result, name)
		}
	}
	return result
}

func cslYear(date cslDate) int32 {
	if len(date.DateParts) > 0 && len(date.DateParts[0]) > 0 {
		return int32(date.DateParts[0][0])
	}
	for _, field := range strings.FieldsFunc(date.Raw, func(r rune) bool {
		return r < '0' || r > '9'
	}) {
		if len(field) == 4 {
			return parseYear(field)
		}
	}
	return 0
}

func parseYear(value string) int32 {
	var year int32
	for _, r := range value {
		year = year*10 + int32(r-'0')
	}
	return year
}
