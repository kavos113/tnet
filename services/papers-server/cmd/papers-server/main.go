package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/kavos113/tnet/services/papers-server/internal/app"
	papersserver "github.com/kavos113/tnet/services/papers-server/internal/server"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:38911", "listen address")
	userDataDir := flag.String("user-data-dir", "", "desktop app user data directory")
	accessLogPath := flag.String("access-log-path", "", "access log file path")
	flag.Parse()

	container, err := app.NewContainer(app.ContainerOptions{
		UserDataDir: *userDataDir,
	})
	if err != nil {
		slog.Error("failed to create app container", "error", err)
		os.Exit(1)
	}
	defer func() {
		if closeErr := container.Close(); closeErr != nil {
			slog.Error("failed to close app container", "error", closeErr)
		}
	}()

	accessLogFile, err := openAccessLogFile(*userDataDir, *accessLogPath)
	if err != nil {
		slog.Error("failed to open access log", "error", err)
		os.Exit(1)
	}
	defer func() {
		if closeErr := accessLogFile.Close(); closeErr != nil {
			slog.Error("failed to close access log", "error", closeErr)
		}
	}()

	httpServer := &http.Server{
		Addr:              *addr,
		Handler:           h2c.NewHandler(papersserver.NewAccessLogHandler(container.Handler(), accessLogFile), &http2.Server{}),
		ReadHeaderTimeout: 5 * time.Second,
	}

	errs := make(chan error, 1)
	go func() {
		slog.Info("starting papers server", "addr", *addr)
		if serveErr := httpServer.ListenAndServe(); !errors.Is(serveErr, http.ErrServerClosed) {
			errs <- serveErr
		}
		close(errs)
	}()

	signals := make(chan os.Signal, 1)
	signal.Notify(signals, os.Interrupt, syscall.SIGTERM)

	select {
	case sig := <-signals:
		slog.Info("stopping papers server", "signal", sig.String())
	case serveErr := <-errs:
		if serveErr != nil {
			slog.Error("papers server failed", "error", serveErr)
			os.Exit(1)
		}
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := httpServer.Shutdown(ctx); err != nil {
		slog.Error("failed to shutdown papers server", "error", err)
		os.Exit(1)
	}
}

func openAccessLogFile(userDataDir string, accessLogPath string) (*os.File, error) {
	path := accessLogPath
	if path == "" {
		if userDataDir == "" {
			path = "papers-server-access.log"
		} else {
			path = filepath.Join(userDataDir, "papers-server-access.log")
		}
	}

	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}
	return os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
}
