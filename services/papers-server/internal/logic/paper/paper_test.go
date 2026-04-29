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
	result   pdfdownload.DownloadedPDF
	err      error
	progress []pdfdownload.Progress
}

func (downloader fakeDownloader) DownloadWithProgress(
	_ context.Context,
	_ string,
	_ pdfdownload.RequestOptions,
	report pdfdownload.ProgressReporter,
) (pdfdownload.DownloadedPDF, error) {
	for _, progress := range downloader.progress {
		report(progress)
	}
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

func TestServiceCreatePaperFromPDFBytes(t *testing.T) {
	ctx := context.Background()
	libraryRoot := t.TempDir()
	service, closeService := newTestService(t)
	defer closeService()

	paper, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
		LibraryRoot:   libraryRoot,
		FileName:      "download.pdf",
		Bytes:         []byte("pdf"),
		Title:         "Paper",
		Authors:       []string{"Alice"},
		PublishedYear: 2025,
		Venue:         "Journal",
		DOI:           "10.1000/bytes",
		DirectoryPath: "articles",
	})
	if err != nil {
		t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
	}

	if paper.PDFPath != "articles/download.pdf" {
		t.Fatalf("PDFPath = %q, want articles/download.pdf", paper.PDFPath)
	}
	if _, err := os.Stat(filepath.Join(libraryRoot, filepath.FromSlash(paper.PDFPath))); err != nil {
		t.Fatalf("expected saved PDF: %v", err)
	}
}

func TestServiceCreatePaperFromPDFBytesUsesSafeFileName(t *testing.T) {
	ctx := context.Background()
	libraryRoot := t.TempDir()
	service, closeService := newTestService(t)
	defer closeService()

	paper, err := service.CreatePaperFromPDFBytes(ctx, CreateFromPDFBytesInput{
		LibraryRoot: libraryRoot,
		FileName:    "not-pdf.txt",
		Bytes:       []byte("pdf"),
		Title:       "Paper",
	})
	if err != nil {
		t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
	}

	if paper.PDFPath != "papers/paper.pdf" {
		t.Fatalf("PDFPath = %q, want papers/paper.pdf", paper.PDFPath)
	}
}

func TestServiceImportBrowserPaperWithProgress(t *testing.T) {
	testcases := []struct {
		name       string
		downloader fakeDownloader
		wantStages []string
		wantStatus string
	}{
		{
			name: "reports pdf download progress",
			downloader: fakeDownloader{
				result: pdfdownload.DownloadedPDF{FileName: "remote.pdf", Bytes: []byte("pdf")},
				progress: []pdfdownload.Progress{
					{DownloadedBytes: 1, TotalBytes: 3},
					{DownloadedBytes: 3, TotalBytes: 3},
				},
			},
			wantStages: []string{
				ImportProgressStageStarted,
				ImportProgressStageDownloadingPDF,
				ImportProgressStageDownloadingPDF,
				ImportProgressStageDownloadedPDF,
				ImportProgressStageSaving,
			},
			wantStatus: "created",
		},
		{
			name: "reports metadata only when pdf download fails",
			downloader: fakeDownloader{
				err: os.ErrNotExist,
			},
			wantStages: []string{
				ImportProgressStageStarted,
				ImportProgressStageMetadataOnly,
				ImportProgressStageSaving,
			},
			wantStatus: "metadata_only",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			service, closeService := newTestServiceWithDownloader(t, testcase.downloader)
			defer closeService()
			var stages []string

			result, err := service.ImportBrowserPaperWithProgress(ctx, BrowserImportInput{
				LibraryRoot:   libraryRoot,
				DirectoryPath: "articles",
				Candidate: model.BrowserImportCandidate{
					Title:  "Remote paper",
					DOI:    "10.1000/" + testcase.name,
					PDFURL: "https://example.test/remote.pdf",
				},
				ImportPDF: true,
			}, func(progress ImportProgress) {
				stages = append(stages, progress.Stage)
			})
			if err != nil {
				t.Fatalf("ImportBrowserPaperWithProgress() error = %v", err)
			}

			if result.Status != testcase.wantStatus {
				t.Fatalf("Status = %q, want %q", result.Status, testcase.wantStatus)
			}
			if !equalStrings(stages, testcase.wantStages) {
				t.Fatalf("stages = %v, want %v", stages, testcase.wantStages)
			}
		})
	}
}

func TestServiceImportBrowserPaperWithProgressDetectsDuplicate(t *testing.T) {
	ctx := context.Background()
	libraryRoot := t.TempDir()
	service, closeService := newTestService(t)
	defer closeService()

	first, err := service.ImportBrowserPaper(ctx, BrowserImportInput{
		LibraryRoot: libraryRoot,
		Candidate: model.BrowserImportCandidate{
			Title: "Paper",
			DOI:   "10.1000/progress-duplicate",
		},
	})
	if err != nil {
		t.Fatalf("first ImportBrowserPaper() error = %v", err)
	}

	var stages []string
	second, err := service.ImportBrowserPaperWithProgress(ctx, BrowserImportInput{
		LibraryRoot: libraryRoot,
		Candidate: model.BrowserImportCandidate{
			Title: "Paper again",
			DOI:   "10.1000/progress-duplicate",
		},
	}, func(progress ImportProgress) {
		stages = append(stages, progress.Stage)
	})
	if err != nil {
		t.Fatalf("second ImportBrowserPaperWithProgress() error = %v", err)
	}

	if second.Status != "duplicate" || second.Paper.ID != first.Paper.ID {
		t.Fatalf("second result = %+v, want duplicate first paper", second)
	}
	if !equalStrings(stages, []string{ImportProgressStageStarted, ImportProgressStageDuplicate}) {
		t.Fatalf("stages = %v, want started and duplicate", stages)
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

func equalStrings(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
