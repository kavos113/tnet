package sqlite

import (
	"context"
	"database/sql"
	"os"
	"path/filepath"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func newTestLibraryRoot(t *testing.T, name string) model.LibraryRoot {
	t.Helper()

	root, err := model.NewLibraryRoot(filepath.Join(t.TempDir(), name))
	if err != nil {
		t.Fatalf("NewLibraryRoot() error = %v", err)
	}

	return root
}

func TestLibraryDBManagerReusesConnectionForSameLibrary(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "same library root reuses connection"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			manager := NewLibraryDBManager()
			defer closeManager(t, manager)

			root := newTestLibraryRoot(t, "library")

			first, err := manager.OpenLibrary(ctx, root)
			if err != nil {
				t.Fatalf("OpenLibrary() first error = %v", err)
			}

			second, err := manager.OpenLibrary(ctx, root)
			if err != nil {
				t.Fatalf("OpenLibrary() second error = %v", err)
			}

			if first != second {
				t.Fatal("OpenLibrary() returned different DB instances for the same library")
			}
		})
	}
}

func TestLibraryDBManagerCreatesConnectionPerLibrary(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "different library roots create different connections"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			manager := NewLibraryDBManager()
			defer closeManager(t, manager)

			first, err := manager.OpenLibrary(ctx, newTestLibraryRoot(t, "first"))
			if err != nil {
				t.Fatalf("OpenLibrary() first error = %v", err)
			}

			second, err := manager.OpenLibrary(ctx, newTestLibraryRoot(t, "second"))
			if err != nil {
				t.Fatalf("OpenLibrary() second error = %v", err)
			}

			if first == second {
				t.Fatal("OpenLibrary() returned the same DB instance for different libraries")
			}
		})
	}
}

func TestLibraryDBManagerCreatesDatabaseAndRunsMigration(t *testing.T) {
	testcases := []struct {
		name          string
		expectedTable string
	}{
		{name: "creates database and papers table", expectedTable: "papers"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			manager := NewLibraryDBManager()
			defer closeManager(t, manager)

			root := newTestLibraryRoot(t, "library")
			db, err := manager.OpenLibrary(ctx, root)
			if err != nil {
				t.Fatalf("OpenLibrary() error = %v", err)
			}

			if _, err := os.Stat(PapersDatabasePath(root)); err != nil {
				t.Fatalf("expected database file to exist: %v", err)
			}

			var tableName string
			err = db.QueryRowContext(
				ctx,
				"SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
				testcase.expectedTable,
			).Scan(&tableName)
			if err != nil {
				t.Fatalf("expected %s table to exist: %v", testcase.expectedTable, err)
			}
			if tableName != testcase.expectedTable {
				t.Fatalf("tableName = %q, want %q", tableName, testcase.expectedTable)
			}
		})
	}
}

func TestLibraryDBManagerCloseClosesConnections(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "close closes opened database connections"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			manager := NewLibraryDBManager()

			root := newTestLibraryRoot(t, "library")
			db, err := manager.OpenLibrary(ctx, root)
			if err != nil {
				t.Fatalf("OpenLibrary() error = %v", err)
			}

			if err := manager.Close(); err != nil {
				t.Fatalf("Close() error = %v", err)
			}

			if err := db.PingContext(ctx); err == nil {
				t.Fatal("PingContext() succeeded after manager closed the DB")
			}
		})
	}
}

func closeManager(t *testing.T, manager *LibraryDBManager) {
	t.Helper()

	if err := manager.Close(); err != nil && !errorsIsDatabaseClosed(err) {
		t.Fatalf("Close() error = %v", err)
	}
}

func errorsIsDatabaseClosed(err error) bool {
	return err == sql.ErrConnDone
}
