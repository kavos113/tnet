package model

import (
	"path/filepath"
	"testing"
)

func TestNewLibraryRoot(t *testing.T) {
	testcases := []struct {
		name    string
		value   string
		wantErr bool
	}{
		{name: "absolute path", value: t.TempDir()},
		{name: "relative path becomes absolute", value: "relative-library"},
		{name: "empty path", value: " ", wantErr: true},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got, err := NewLibraryRoot(testcase.value)
			if testcase.wantErr {
				if err == nil {
					t.Fatal("NewLibraryRoot() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}
			if !filepath.IsAbs(got.String()) {
				t.Fatalf("NewLibraryRoot() = %q, want absolute path", got.String())
			}
		})
	}
}

func TestNewRelativePath(t *testing.T) {
	testcases := []struct {
		name    string
		value   string
		want    string
		wantErr bool
	}{
		{name: "empty path", value: " ", want: ""},
		{name: "normalizes slashes", value: ` papers\accepted `, want: "papers/accepted"},
		{name: "cleans dot segments", value: "papers/./accepted", want: "papers/accepted"},
		{name: "trims surrounding slashes", value: "/papers/", want: "papers"},
		{name: "rejects parent escape", value: "../outside", wantErr: true},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got, err := NewRelativePath(testcase.value)
			if testcase.wantErr {
				if err == nil {
					t.Fatal("NewRelativePath() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("NewRelativePath() error = %v", err)
			}
			if got.String() != testcase.want {
				t.Fatalf("NewRelativePath() = %q, want %q", got.String(), testcase.want)
			}
		})
	}
}

func TestNormalizePapersLibraryConfig(t *testing.T) {
	testcases := []struct {
		name  string
		input PapersLibraryConfig
		want  PapersLibraryConfig
	}{
		{
			name:  "fills defaults",
			input: PapersLibraryConfig{},
			want:  DefaultPapersLibraryConfig(),
		},
		{
			name: "keeps explicit values",
			input: PapersLibraryConfig{
				ListDensity:            "compact",
				PDFZoomMode:            "page-fit",
				NoteEditorMode:         "editor",
				NoteAutoSaveDebounceMs: 1000,
			},
			want: PapersLibraryConfig{
				ListDensity:            "compact",
				PDFZoomMode:            "page-fit",
				NoteEditorMode:         "editor",
				NoteAutoSaveDebounceMs: 1000,
			},
		},
		{
			name:  "normalizes non-positive debounce",
			input: PapersLibraryConfig{NoteAutoSaveDebounceMs: -1},
			want:  DefaultPapersLibraryConfig(),
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got := NormalizePapersLibraryConfig(testcase.input)
			if got != testcase.want {
				t.Fatalf("NormalizePapersLibraryConfig() = %+v, want %+v", got, testcase.want)
			}
		})
	}
}
