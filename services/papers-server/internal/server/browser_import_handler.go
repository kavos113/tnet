package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
)

type BrowserImportHandler struct{}

func NewBrowserImportHandler() (string, http.Handler) {
	return papersv1connect.NewBrowserImportServiceHandler(&BrowserImportHandler{})
}

func (handler *BrowserImportHandler) ResolveMetadata(
	_ context.Context,
	request *connect.Request[papersv1.ResolveMetadataRequest],
) (*connect.Response[papersv1.BrowserPaperImportCandidate], error) {
	source := request.Msg.Source
	if source == nil {
		return connect.NewResponse(&papersv1.BrowserPaperImportCandidate{}), nil
	}
	title := source.Title
	if title == "" {
		title = source.PageTitle
	}
	return connect.NewResponse(&papersv1.BrowserPaperImportCandidate{
		Source:        source,
		Title:         title,
		Authors:       source.Authors,
		PublishedYear: source.PublishedYear,
		Venue:         source.Venue,
		Doi:           source.Doi,
		ArxivId:       source.ArxivId,
		PdfUrl:        source.PdfUrl,
	}), nil
}
