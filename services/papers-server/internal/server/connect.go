package server

import (
	"net/http"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/health"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/library"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/metadataresolver"
)

func RegisterHandlers(
	mux *http.ServeMux,
	healthService *health.Service,
	libraryService *library.Service,
	paperService *paper.Service,
	metadataResolver metadataresolver.Resolver,
) {
	healthPath, healthHandler := NewHealthHandler(healthService)
	mux.Handle(healthPath, healthHandler)
	libraryPath, libraryHandler := NewLibraryHandler(libraryService)
	mux.Handle(libraryPath, libraryHandler)
	paperPath, paperHandler := NewPaperHandler(paperService)
	mux.Handle(paperPath, paperHandler)
	tagPath, tagHandler := NewTagHandler(paperService)
	mux.Handle(tagPath, tagHandler)
	pdfPath, pdfHandler := NewPDFHandler(paperService)
	mux.Handle(pdfPath, pdfHandler)
	browserImportPath, browserImportHandler := NewBrowserImportHandler(metadataResolver)
	mux.Handle(browserImportPath, browserImportHandler)
}
