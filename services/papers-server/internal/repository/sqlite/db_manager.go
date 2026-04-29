package sqlite

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
	_ "modernc.org/sqlite"
)

const sqliteDriverName = "sqlite"

type LibraryDBManager struct {
	mu          sync.Mutex
	connections map[string]*sql.DB
}

func NewLibraryDBManager() *LibraryDBManager {
	return &LibraryDBManager{
		connections: make(map[string]*sql.DB),
	}
}

func (manager *LibraryDBManager) OpenLibrary(
	ctx context.Context,
	libraryRoot model.LibraryRoot,
) (*sql.DB, error) {
	key := libraryRoot.String()

	manager.mu.Lock()
	if db, ok := manager.connections[key]; ok {
		manager.mu.Unlock()
		return db, nil
	}
	manager.mu.Unlock()

	db, err := openLibraryDB(ctx, libraryRoot)
	if err != nil {
		return nil, err
	}

	manager.mu.Lock()
	defer manager.mu.Unlock()
	if existing, ok := manager.connections[key]; ok {
		_ = db.Close()
		return existing, nil
	}
	manager.connections[key] = db

	return db, nil
}

func (manager *LibraryDBManager) Close() error {
	manager.mu.Lock()
	defer manager.mu.Unlock()

	var closeErr error
	for key, db := range manager.connections {
		if err := db.Close(); err != nil {
			closeErr = errors.Join(closeErr, fmt.Errorf("close %s: %w", key, err))
		}
		delete(manager.connections, key)
	}

	return closeErr
}

func PapersDataDir(libraryRoot model.LibraryRoot) string {
	return filepath.Join(libraryRoot.String(), ".tnet", "papers")
}

func PapersDatabasePath(libraryRoot model.LibraryRoot) string {
	return filepath.Join(PapersDataDir(libraryRoot), "papers.db")
}

func openLibraryDB(ctx context.Context, libraryRoot model.LibraryRoot) (*sql.DB, error) {
	if err := os.MkdirAll(PapersDataDir(libraryRoot), 0o755); err != nil {
		return nil, err
	}

	db, err := sql.Open(sqliteDriverName, PapersDatabasePath(libraryRoot))
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)

	if err := configureAndMigrate(ctx, db); err != nil {
		_ = db.Close()
		return nil, err
	}

	return db, nil
}

func configureAndMigrate(ctx context.Context, db *sql.DB) error {
	pragmas := []string{
		"PRAGMA foreign_keys = ON",
		"PRAGMA journal_mode = WAL",
		"PRAGMA busy_timeout = 5000",
	}
	for _, pragma := range pragmas {
		if _, err := db.ExecContext(ctx, pragma); err != nil {
			return err
		}
	}

	_, err := db.ExecContext(ctx, schemaSQL)
	return err
}
