package app

import (
	"net/http"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/health"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/sqlite"
	papersserver "github.com/kavos113/tnet/services/papers-server/internal/server"
)

type Container struct {
	dbManager *sqlite.LibraryDBManager
	handler   http.Handler
}

func NewContainer() (*Container, error) {
	dbManager := sqlite.NewLibraryDBManager()
	healthService := health.NewService("0.1.0")

	mux := http.NewServeMux()
	papersserver.RegisterHandlers(mux, healthService)

	return &Container{
		dbManager: dbManager,
		handler:   mux,
	}, nil
}

func (c *Container) Handler() http.Handler {
	return c.handler
}

func (c *Container) Close() error {
	return c.dbManager.Close()
}
