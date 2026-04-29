package main

import (
	"context"
	"errors"
	"flag"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/kavos113/tnet/services/papers-server/internal/app"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:38911", "listen address")
	flag.Parse()

	container, err := app.NewContainer()
	if err != nil {
		slog.Error("failed to create app container", "error", err)
		os.Exit(1)
	}
	defer func() {
		if closeErr := container.Close(); closeErr != nil {
			slog.Error("failed to close app container", "error", closeErr)
		}
	}()

	httpServer := &http.Server{
		Addr:              *addr,
		Handler:           container.Handler(),
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
