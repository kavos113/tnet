package paper

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
	"github.com/kavos113/tnet/services/papers-server/internal/pdfdownload"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/sqlite"
)

type fakeDownloader struct {
	result pdfdownload.DownloadedPDF
	err    error
}

func (downloader fakeDownloader) Download(context.Context, string) (pdfdownload.DownloadedPDF, error) {
	return downloader.result, downloader.err
}

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

func TestServiceImportBrowserPaper(t *testing.T) {
	testcases := []struct {
		name       string
		importPDF  bool
		wantStatus string
		wantPDF    string
	}{
		{name: "downloads pdf", importPDF: true, wantStatus: "created", wantPDF: "articles/remote.pdf"},
		{name: "metadata only when pdf import is disabled", importPDF: false, wantStatus: "metadata_only", wantPDF: ""},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestServiceWithDownloader(t, fakeDownloader{
				result: pdfdownload.DownloadedPDF{FileName: "remote.pdf", Bytes: []byte("pdf")},
			})
			defer closeService()

			result, err := service.ImportBrowserPaper(ctx, BrowserImportInput{
				LibraryRoot:   libraryRoot,
				DirectoryPath: "articles",
				Candidate: model.BrowserImportCandidate{
					Title:  "Remote paper",
					DOI:    "10.1000/" + testcase.name,
					PDFURL: "https://example.test/remote.pdf",
				},
				ImportPDF: testcase.importPDF,
			})
			if err != nil {
				t.Fatalf("ImportBrowserPaper() error = %v", err)
			}

			if result.Status != testcase.wantStatus {
				t.Fatalf("Status = %q, want %q", result.Status, testcase.wantStatus)
			}
			if result.Paper.PDFPath != testcase.wantPDF {
				t.Fatalf("PDFPath = %q, want %q", result.Paper.PDFPath, testcase.wantPDF)
			}
		})
	}
}

func TestServiceImportBrowserPaperDetectsDuplicate(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "returns duplicate by DOI"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestService(t)
			defer closeService()

			first, err := service.ImportBrowserPaper(ctx, BrowserImportInput{
				LibraryRoot: libraryRoot,
				Candidate: model.BrowserImportCandidate{
					Title: "Paper",
					DOI:   "10.1000/duplicate",
				},
			})
			if err != nil {
				t.Fatalf("first ImportBrowserPaper() error = %v", err)
			}

			second, err := service.ImportBrowserPaper(ctx, BrowserImportInput{
				LibraryRoot: libraryRoot,
				Candidate: model.BrowserImportCandidate{
					Title: "Paper again",
					DOI:   "10.1000/duplicate",
				},
			})
			if err != nil {
				t.Fatalf("second ImportBrowserPaper() error = %v", err)
			}

			if second.Status != "duplicate" || second.Paper.ID != first.Paper.ID {
				t.Fatalf("second result = %+v, want duplicate first paper", second)
			}
		})
	}
}

func newTestService(t *testing.T) (*Service, func()) {
	t.Helper()
	return newTestServiceWithDownloader(t, fakeDownloader{})
}

func newTestServiceWithDownloader(t *testing.T, downloader fakeDownloader) (*Service, func()) {
	t.Helper()
	manager := sqlite.NewLibraryDBManager()
	return NewServiceWithDownloader(manager, downloader), func() {
		if err := manager.Close(); err != nil {
			t.Fatalf("Close() error = %v", err)
		}
	}
}
