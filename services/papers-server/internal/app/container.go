package app

import (
	"net/http"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/health"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/library"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	configrepository "github.com/kavos113/tnet/services/papers-server/internal/repository/config"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/filesystem"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/sqlite"
	papersserver "github.com/kavos113/tnet/services/papers-server/internal/server"
)

type Container struct {
	dbManager *sqlite.LibraryDBManager
	handler   http.Handler
}

type ContainerOptions struct {
	UserDataDir string
}

func NewContainer(options ContainerOptions) (*Container, error) {
	dbManager := sqlite.NewLibraryDBManager()
	healthService := health.NewService("0.1.0")
	configRepository := configrepository.NewJSONRepository()
	directoryRepository := filesystem.NewDirectoryRepository()
	libraryService := library.NewService(configRepository, directoryRepository, options.UserDataDir)
	paperService := paper.NewService(sqlite.NewPaperStore(dbManager))

	mux := http.NewServeMux()
	papersserver.RegisterHandlers(mux, healthService, libraryService, paperService)

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
