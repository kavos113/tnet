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

			result, err := service.CreatePaperFromLocalPDF(ctx, CreateFromLocalPDFInput{
				LibraryRoot:   libraryRoot,
				SourcePath:    sourcePath,
				Title:         "Paper",
				DirectoryPath: "articles",
			})
			if err != nil {
				t.Fatalf("CreatePaperFromLocalPDF() error = %v", err)
			}

			if result.Paper.PDFPath != "articles/paper.pdf" {
				t.Fatalf("PDFPath = %q, want articles/paper.pdf", result.Paper.PDFPath)
			}
			if _, err := os.Stat(filepath.Join(libraryRoot, filepath.FromSlash(result.Paper.PDFPath))); err != nil {
				t.Fatalf("expected copied PDF: %v", err)
			}
		})
	}
}

func TestServiceCreatePaperFromLocalPDFReturnsExistingPaperForSameLibraryPath(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "returns existing paper when the same library pdf is imported again"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			pdfPath := filepath.Join(libraryRoot, "articles", "paper.pdf")
			if err := os.MkdirAll(filepath.Dir(pdfPath), 0o755); err != nil {
				t.Fatalf("MkdirAll() error = %v", err)
			}
			if err := os.WriteFile(pdfPath, []byte("pdf"), 0o644); err != nil {
				t.Fatalf("WriteFile() error = %v", err)
			}
			service, closeService := newTestService(t)
			defer closeService()

			first, err := service.CreatePaperFromLocalPDF(ctx, CreateFromLocalPDFInput{
				LibraryRoot: libraryRoot,
				SourcePath:  pdfPath,
				Title:       "First",
			})
			if err != nil {
				t.Fatalf("first CreatePaperFromLocalPDF() error = %v", err)
			}
			second, err := service.CreatePaperFromLocalPDF(ctx, CreateFromLocalPDFInput{
				LibraryRoot: libraryRoot,
				SourcePath:  pdfPath,
				Title:       "Second",
			})
			if err != nil {
				t.Fatalf("second CreatePaperFromLocalPDF() error = %v", err)
			}

			if second.Paper.ID != first.Paper.ID {
				t.Fatalf("second ID = %q, want existing %q", second.Paper.ID, first.Paper.ID)
			}
			if second.Paper.Title != "First" {
				t.Fatalf("second Title = %q, want existing title First", second.Paper.Title)
			}
			if !second.AlreadyExists || second.DuplicateField != "pdf_path" {
				t.Fatalf("second duplicate status = %+v, want pdf_path duplicate", second)
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

			result, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
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

			if result.Paper.PDFPath != testcase.wantPDFPath {
				t.Fatalf("PDFPath = %q, want %q", result.Paper.PDFPath, testcase.wantPDFPath)
			}
			if _, err := os.Stat(filepath.Join(libraryRoot, filepath.FromSlash(result.Paper.PDFPath))); err != nil {
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

			if first.Paper.PDFPath != "papers/paper.pdf" {
				t.Fatalf("first PDFPath = %q, want papers/paper.pdf", first.Paper.PDFPath)
			}
			if second.Paper.PDFPath != "papers/paper 2.pdf" {
				t.Fatalf("second PDFPath = %q, want papers/paper 2.pdf", second.Paper.PDFPath)
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytesReturnsExistingPaperForIdentifiers(t *testing.T) {
	testcases := []struct {
		name          string
		firstDOI      string
		firstArxivID  string
		secondDOI     string
		secondArxivID string
		wantDuplicate string
	}{
		{
			name:          "returns existing paper for duplicate DOI",
			firstDOI:      "10.1000/duplicate",
			secondDOI:     "10.1000/duplicate",
			wantDuplicate: "doi",
		},
		{
			name:          "returns existing paper for duplicate arXiv ID",
			firstArxivID:  "2601.00001",
			secondArxivID: "2601.00001",
			wantDuplicate: "arxiv_id",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			first, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "first.pdf",
				Bytes:       []byte("first"),
				Title:       "First",
				DOI:         testcase.firstDOI,
				ArxivID:     testcase.firstArxivID,
			})
			if err != nil {
				t.Fatalf("first CreatePaperFromPDFBytes() error = %v", err)
			}
			second, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "second.pdf",
				Bytes:       []byte("second"),
				Title:       "Second",
				DOI:         testcase.secondDOI,
				ArxivID:     testcase.secondArxivID,
			})
			if err != nil {
				t.Fatalf("second CreatePaperFromPDFBytes() error = %v", err)
			}

			if second.Paper.ID != first.Paper.ID {
				t.Fatalf("second ID = %q, want existing %q", second.Paper.ID, first.Paper.ID)
			}
			if !second.AlreadyExists || second.DuplicateField != testcase.wantDuplicate {
				t.Fatalf("duplicate status = %+v, want %s", second, testcase.wantDuplicate)
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytesAttachesImportTags(t *testing.T) {
	testcases := []struct {
		name string
		tags []string
		want []string
	}{
		{name: "attaches comma parsed import tags", tags: []string{"ai", "retrieval"}, want: []string{"ai", "retrieval"}},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			result, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "paper.pdf",
				Bytes:       []byte("pdf"),
				Title:       "Paper",
				Tags:        testcase.tags,
			})
			if err != nil {
				t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
			}
			if len(result.Paper.Tags) != len(testcase.want) {
				t.Fatalf("Tags = %+v, want %+v", result.Paper.Tags, testcase.want)
			}
			for index, want := range testcase.want {
				if result.Paper.Tags[index] != want {
					t.Fatalf("Tags = %+v, want %+v", result.Paper.Tags, testcase.want)
				}
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytesNormalizesDirectoryPath(t *testing.T) {
	testcases := []struct {
		name        string
		directory   string
		wantPDFPath string
		wantErr     bool
	}{
		{
			name:        "normalizes slash style and dot segments",
			directory:   `articles\2026\..\accepted`,
			wantPDFPath: "articles/accepted/paper.pdf",
		},
		{
			name:      "rejects parent traversal",
			directory: "../outside",
			wantErr:   true,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			result, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
				LibraryRoot:   libraryRoot,
				FileName:      "paper.pdf",
				Bytes:         []byte("pdf"),
				Title:         "Paper",
				DirectoryPath: testcase.directory,
			})

			if testcase.wantErr {
				if err == nil {
					t.Fatalf("CreatePaperFromPDFBytes() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
			}
			if result.Paper.PDFPath != testcase.wantPDFPath {
				t.Fatalf("PDFPath = %q, want %q", result.Paper.PDFPath, testcase.wantPDFPath)
			}
			if result.Paper.DirectoryPath != "articles/accepted" {
				t.Fatalf("DirectoryPath = %q, want articles/accepted", result.Paper.DirectoryPath)
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
