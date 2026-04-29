package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/metadataresolver"
)

type BrowserMetadataResolver interface {
	Resolve(context.Context, metadataresolver.Source) (metadataresolver.Metadata, error)
}

type BrowserImportHandler struct {
	resolver BrowserMetadataResolver
}

func NewBrowserImportHandler(resolver BrowserMetadataResolver) (string, http.Handler) {
	return papersv1connect.NewBrowserImportServiceHandler(&BrowserImportHandler{resolver: resolver})
}

func (handler *BrowserImportHandler) ResolveMetadata(
	ctx context.Context,
	request *connect.Request[papersv1.ResolveMetadataRequest],
) (*connect.Response[papersv1.BrowserPaperImportCandidate], error) {
	source := request.Msg.Source
	if source == nil {
		return connect.NewResponse(&papersv1.BrowserPaperImportCandidate{}), nil
	}
	resolved := metadataresolver.Metadata{}
	if handler.resolver != nil {
		metadata, err := handler.resolver.Resolve(ctx, metadataresolver.Source{
			SourceURL: source.SourceUrl,
			DOI:       source.Doi,
			ArxivID:   source.ArxivId,
		})
		if err == nil {
			resolved = metadata
		}
	}
	return connect.NewResponse(&papersv1.BrowserPaperImportCandidate{
		Source:        source,
		Title:         firstString(source.Title, resolved.Title, source.PageTitle),
		Authors:       firstStringSlice(source.Authors, resolved.Authors),
		Abstract:      resolved.Abstract,
		PublishedYear: firstInt32(source.PublishedYear, resolved.PublishedYear),
		Venue:         firstString(source.Venue, resolved.Venue),
		Doi:           firstString(source.Doi, resolved.DOI),
		ArxivId:       source.ArxivId,
		PdfUrl:        firstString(source.PdfUrl, resolved.PDFURL),
	}), nil
}

func firstString(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func firstStringSlice(values ...[]string) []string {
	for _, value := range values {
		if len(value) > 0 {
			return value
		}
	}
	return nil
}

func firstInt32(values ...int32) int32 {
	for _, value := range values {
		if value != 0 {
			return value
		}
	}
	return 0
}
