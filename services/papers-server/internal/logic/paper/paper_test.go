package paper

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/repository/sqlite"
)

func TestServiceCreatePaperFromLocalPDFCopiesExternalPDF(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "copies external pdf into selected directory"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			sourcePath := filepath.Join(t.TempDir(), "paper.pdf")
			if err := os.WriteFile(sourcePath, []byte("pdf"), 0o644); err != nil {
				t.Fatalf("WriteFile() error = %v", err)
			}
			service, closeService := newTestService(t)
			defer closeService()

			paper, err := service.CreatePaperFromLocalPDF(ctx, CreateFromLocalPDFInput{
				LibraryRoot:   libraryRoot,
				SourcePath:    sourcePath,
				Title:         "Paper",
				DirectoryPath: "articles",
			})
			if err != nil {
				t.Fatalf("CreatePaperFromLocalPDF() error = %v", err)
			}

			if paper.PDFPath != "articles/paper.pdf" {
				t.Fatalf("PDFPath = %q, want articles/paper.pdf", paper.PDFPath)
			}
			if _, err := os.Stat(filepath.Join(libraryRoot, filepath.FromSlash(paper.PDFPath))); err != nil {
				t.Fatalf("expected copied PDF: %v", err)
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytes(t *testing.T) {
	testcases := []struct {
		name        string
		fileName    string
		directory   string
		wantPDFPath string
	}{
		{
			name:        "saves bytes into selected directory",
			fileName:    "download.pdf",
			directory:   "articles",
			wantPDFPath: "articles/download.pdf",
		},
		{
			name:        "uses safe fallback file name",
			fileName:    "not-pdf.txt",
			wantPDFPath: "papers/paper.pdf",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			paper, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot:   libraryRoot,
				FileName:      testcase.fileName,
				Bytes:         []byte("pdf"),
				Title:         "Paper",
				Authors:       []string{"Alice"},
				PublishedYear: 2025,
				Venue:         "Journal",
				DOI:           "10.1000/" + testcase.name,
				DirectoryPath: testcase.directory,
			})
			if err != nil {
				t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
			}

			if paper.PDFPath != testcase.wantPDFPath {
				t.Fatalf("PDFPath = %q, want %q", paper.PDFPath, testcase.wantPDFPath)
			}
			if _, err := os.Stat(filepath.Join(libraryRoot, filepath.FromSlash(paper.PDFPath))); err != nil {
				t.Fatalf("expected saved PDF: %v", err)
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytesAvoidsFileNameCollision(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "adds numeric suffix when file exists"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			first, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "paper.pdf",
				Bytes:       []byte("first"),
				Title:       "First",
				DOI:         "10.1000/collision-first",
			})
			if err != nil {
				t.Fatalf("first CreatePaperFromPDFBytes() error = %v", err)
			}
			second, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "paper.pdf",
				Bytes:       []byte("second"),
				Title:       "Second",
				DOI:         "10.1000/collision-second",
			})
			if err != nil {
				t.Fatalf("second CreatePaperFromPDFBytes() error = %v", err)
			}

			if first.PDFPath != "papers/paper.pdf" {
				t.Fatalf("first PDFPath = %q, want papers/paper.pdf", first.PDFPath)
			}
			if second.PDFPath != "papers/paper 2.pdf" {
				t.Fatalf("second PDFPath = %q, want papers/paper 2.pdf", second.PDFPath)
			}
		})
	}
}

func newTestService(t *testing.T) (*Service, func()) {
	t.Helper()
	manager := sqlite.NewLibraryDBManager()
	return NewService(manager), func() {
		if err := manager.Close(); err != nil {
			t.Fatalf("Close() error = %v", err)
		}
	}
}
