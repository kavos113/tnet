package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
)

type HealthChecker interface {
	Status() (string, string)
}

type HealthHandler struct {
	service HealthChecker
}

func NewHealthHandler(service HealthChecker) (string, http.Handler) {
	return papersv1connect.NewHealthServiceHandler(&HealthHandler{service: service})
}

func (h *HealthHandler) Check(
	context.Context,
	*connect.Request[papersv1.CheckRequest],
) (*connect.Response[papersv1.CheckResponse], error) {
	status, version := h.service.Status()
	return connect.NewResponse(&papersv1.CheckResponse{
		Status:  status,
		Version: version,
	}), nil
}
