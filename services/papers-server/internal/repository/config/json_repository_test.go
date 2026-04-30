package config

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func TestJSONRepositoryGlobalConfig(t *testing.T) {
	testcases := []struct {
		name    string
		setup   func(t *testing.T, userDataDir string)
		want    model.PapersGlobalConfig
		wantErr bool
	}{
		{
			name: "missing file returns default",
			want: model.DefaultPapersGlobalConfig(),
		},
		{
			name: "loads papers app config",
			setup: func(t *testing.T, userDataDir string) {
				t.Helper()
				writeFile(t, filepath.Join(userDataDir, "config.json"), `{
					"activeAppId": "papers",
					"apps": {
						"papers": {
							"libraryRoots": ["C:/papers"],
							"activeLibraryRoot": "C:/papers",
							"lastOpenedDirectory": "accepted"
						}
					}
				}`)
			},
			want: model.PapersGlobalConfig{
				LibraryRoots:        []string{"C:/papers"},
				ActiveLibraryRoot:   "C:/papers",
				LastOpenedDirectory: "accepted",
			},
		},
		{
			name: "broken json returns error",
			setup: func(t *testing.T, userDataDir string) {
				t.Helper()
				writeFile(t, filepath.Join(userDataDir, "config.json"), `{`)
			},
			wantErr: true,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			userDataDir := t.TempDir()
			if testcase.setup != nil {
				testcase.setup(t, userDataDir)
			}
			got, err := NewJSONRepository().LoadPapersGlobalConfig(context.Background(), userDataDir)
			if testcase.wantErr {
				if err == nil {
					t.Fatal("LoadPapersGlobalConfig() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("LoadPapersGlobalConfig() error = %v", err)
			}
			assertStringSlice(t, got.LibraryRoots, testcase.want.LibraryRoots)
			if got.ActiveLibraryRoot != testcase.want.ActiveLibraryRoot || got.LastOpenedDirectory != testcase.want.LastOpenedDirectory {
				t.Fatalf("LoadPapersGlobalConfig() = %+v, want %+v", got, testcase.want)
			}
		})
	}
}

func TestJSONRepositorySaveAndLoadGlobalConfig(t *testing.T) {
	testcases := []struct {
		name   string
		config model.PapersGlobalConfig
	}{
		{
			name: "saves papers app config",
			config: model.PapersGlobalConfig{
				LibraryRoots:      []string{"C:/papers"},
				ActiveLibraryRoot: "C:/papers",
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			userDataDir := t.TempDir()
			repository := NewJSONRepository()
			if err := repository.SavePapersGlobalConfig(ctx, userDataDir, testcase.config); err != nil {
				t.Fatalf("SavePapersGlobalConfig() error = %v", err)
			}
			got, err := repository.LoadPapersGlobalConfig(ctx, userDataDir)
			if err != nil {
				t.Fatalf("LoadPapersGlobalConfig() error = %v", err)
			}
			assertStringSlice(t, got.LibraryRoots, testcase.config.LibraryRoots)
			if got.ActiveLibraryRoot != testcase.config.ActiveLibraryRoot {
				t.Fatalf("ActiveLibraryRoot = %q, want %q", got.ActiveLibraryRoot, testcase.config.ActiveLibraryRoot)
			}
		})
	}
}

func TestJSONRepositoryLibraryConfig(t *testing.T) {
	testcases := []struct {
		name    string
		setup   func(t *testing.T, libraryRoot model.LibraryRoot)
		want    model.PapersLibraryConfig
		wantErr bool
	}{
		{
			name: "missing file returns normalized default",
			want: model.DefaultPapersLibraryConfig(),
		},
		{
			name: "loads and normalizes partial settings",
			setup: func(t *testing.T, libraryRoot model.LibraryRoot) {
				t.Helper()
				writeFile(t, papersSettingsPath(libraryRoot), `{"listDensity":"compact"}`)
			},
			want: model.PapersLibraryConfig{
				ListDensity:            "compact",
				PDFZoomMode:            "page-width",
				NoteEditorMode:         "split",
				NoteAutoSaveDebounceMs: 500,
				NoteEditorFontFamily:   "monospace",
				NoteEditorFontSize:     16,
				NotePreviewFontFamily:  "sans-serif",
				NotePreviewFontSize:    16,
			},
		},
		{
			name: "broken json returns error",
			setup: func(t *testing.T, libraryRoot model.LibraryRoot) {
				t.Helper()
				writeFile(t, papersSettingsPath(libraryRoot), `{`)
			},
			wantErr: true,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			root, err := model.NewLibraryRoot(t.TempDir())
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}
			if testcase.setup != nil {
				testcase.setup(t, root)
			}
			got, err := NewJSONRepository().LoadPapersLibraryConfig(context.Background(), root)
			if testcase.wantErr {
				if err == nil {
					t.Fatal("LoadPapersLibraryConfig() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("LoadPapersLibraryConfig() error = %v", err)
			}
			if got != testcase.want {
				t.Fatalf("LoadPapersLibraryConfig() = %+v, want %+v", got, testcase.want)
			}
		})
	}
}

func TestJSONRepositorySaveAndLoadLibraryConfig(t *testing.T) {
	testcases := []struct {
		name   string
		config model.PapersLibraryConfig
		want   model.PapersLibraryConfig
	}{
		{
			name:   "saves normalized library config",
			config: model.PapersLibraryConfig{ListDensity: "compact"},
			want: model.PapersLibraryConfig{
				ListDensity:            "compact",
				PDFZoomMode:            "page-width",
				NoteEditorMode:         "split",
				NoteAutoSaveDebounceMs: 500,
				NoteEditorFontFamily:   "monospace",
				NoteEditorFontSize:     16,
				NotePreviewFontFamily:  "sans-serif",
				NotePreviewFontSize:    16,
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			root, err := model.NewLibraryRoot(t.TempDir())
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}
			repository := NewJSONRepository()
			if err := repository.SavePapersLibraryConfig(ctx, root, testcase.config); err != nil {
				t.Fatalf("SavePapersLibraryConfig() error = %v", err)
			}
			got, err := repository.LoadPapersLibraryConfig(ctx, root)
			if err != nil {
				t.Fatalf("LoadPapersLibraryConfig() error = %v", err)
			}
			if got != testcase.want {
				t.Fatalf("LoadPapersLibraryConfig() = %+v, want %+v", got, testcase.want)
			}
		})
	}
}

func TestJSONRepositorySaveRequiresUserDataDir(t *testing.T) {
	err := NewJSONRepository().SavePapersGlobalConfig(context.Background(), "", model.DefaultPapersGlobalConfig())
	if err == nil || !strings.Contains(err.Error(), "user data dir") {
		t.Fatalf("SavePapersGlobalConfig() error = %v, want user data dir error", err)
	}
}

func writeFile(t *testing.T, filePath string, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
	if err := os.WriteFile(filePath, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}
}

func assertStringSlice(t *testing.T, got []string, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("slice length = %d, want %d; got %#v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("slice[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}
