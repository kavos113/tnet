package server

import (
	"net/http"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/health"
)

func RegisterHandlers(mux *http.ServeMux, healthService *health.Service) {
	healthPath, healthHandler := NewHealthHandler(healthService)
	mux.Handle(healthPath, healthHandler)
}
