package metadataresolver

import (
	"context"
	"encoding/json"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const defaultCrossrefBaseURL = "https://api.crossref.org"

type CrossrefResolver struct {
	httpClient *http.Client
	baseURL    string
}

func NewCrossrefResolver(httpClient *http.Client) *CrossrefResolver {
	if httpClient == nil {
		httpClient = http.DefaultClient
	}
	return &CrossrefResolver{
		httpClient: httpClient,
		baseURL:    defaultCrossrefBaseURL,
	}
}

func NewCrossrefResolverWithBaseURL(httpClient *http.Client, baseURL string) *CrossrefResolver {
	resolver := NewCrossrefResolver(httpClient)
	resolver.baseURL = strings.TrimRight(baseURL, "/")
	return resolver
}

func (resolver *CrossrefResolver) Resolve(ctx context.Context, source Source) (Metadata, error) {
	if source.DOI == "" {
		return Metadata{}, ErrUnsupported
	}

	endpoint := resolver.baseURL + "/works/" + url.PathEscape(source.DOI)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return Metadata{}, err
	}
	request.Header.Set("Accept", "application/json")
	request.Header.Set("User-Agent", "tnet-papers-server/0.1")

	response, err := resolver.httpClient.Do(request)
	if err != nil {
		return Metadata{}, err
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return Metadata{}, fmt.Errorf("crossref returned status %d", response.StatusCode)
	}

	var payload crossrefResponse
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		return Metadata{}, err
	}
	message := payload.Message
	return Metadata{
		Title:         first(message.Title),
		Authors:       crossrefAuthors(message.Author),
		Abstract:      cleanHTML(message.Abstract),
		PublishedYear: crossrefYear(message),
		Venue:         first(message.ContainerTitle),
		DOI:           message.DOI,
		URL:           firstNonEmpty(message.URL, source.SourceURL),
		PDFURL:        crossrefPDFURL(message.Link),
	}, nil
}

type crossrefResponse struct {
	Message crossrefMessage `json:"message"`
}

type crossrefMessage struct {
	Title           []string         `json:"title"`
	Author          []crossrefAuthor `json:"author"`
	Abstract        string           `json:"abstract"`
	ContainerTitle  []string         `json:"container-title"`
	DOI             string           `json:"DOI"`
	URL             string           `json:"URL"`
	PublishedPrint  crossrefDate     `json:"published-print"`
	PublishedOnline crossrefDate     `json:"published-online"`
	Published       crossrefDate     `json:"published"`
	Issued          crossrefDate     `json:"issued"`
	Link            []crossrefLink   `json:"link"`
}

type crossrefAuthor struct {
	Given  string `json:"given"`
	Family string `json:"family"`
	Name   string `json:"name"`
}

type crossrefDate struct {
	DateParts [][]int `json:"date-parts"`
}

type crossrefLink struct {
	URL         string `json:"URL"`
	ContentType string `json:"content-type"`
}

func crossrefAuthors(authors []crossrefAuthor) []string {
	result := make([]string, 0, len(authors))
	for _, author := range authors {
		name := strings.TrimSpace(author.Name)
		if name == "" {
			name = strings.TrimSpace(strings.TrimSpace(author.Given) + " " + strings.TrimSpace(author.Family))
		}
		if name != "" {
			result = append(result, name)
		}
	}
	return result
}

func crossrefYear(message crossrefMessage) int32 {
	for _, date := range []crossrefDate{
		message.PublishedPrint,
		message.PublishedOnline,
		message.Published,
		message.Issued,
	} {
		if len(date.DateParts) > 0 && len(date.DateParts[0]) > 0 {
			year := date.DateParts[0][0]
			if year > 0 && year <= time.Now().Year()+1 {
				return int32(year)
			}
		}
	}
	return 0
}

func crossrefPDFURL(links []crossrefLink) string {
	for _, link := range links {
		if strings.Contains(strings.ToLower(link.ContentType), "pdf") || strings.HasSuffix(strings.ToLower(link.URL), ".pdf") || strings.Contains(strings.ToLower(link.URL), "/pdf/") {
			return link.URL
		}
	}
	return ""
}

func first(values []string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func cleanHTML(value string) string {
	value = strings.TrimSpace(value)
	value = strings.TrimPrefix(value, "<jats:p>")
	value = strings.TrimSuffix(value, "</jats:p>")
	return html.UnescapeString(strings.TrimSpace(value))
}
