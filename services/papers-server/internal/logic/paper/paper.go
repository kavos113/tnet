package paper

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
	"github.com/kavos113/tnet/services/papers-server/internal/pdfdownload"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/sqlite"
)

type DBManager interface {
	OpenLibrary(context.Context, model.LibraryRoot) (sqliteDB, error)
}

type sqliteDB interface{}

type Service struct {
	dbManager  *sqlite.LibraryDBManager
	downloader PDFDownloader
}

type ListFilter struct {
	DirectoryPath string
	HasDirectory  bool
	Query         string
	TagIDs        []string
}

type CreateFromLocalPDFInput struct {
	LibraryRoot   string
	SourcePath    string
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	DirectoryPath string
}

type BrowserImportInput struct {
	LibraryRoot   string
	DirectoryPath string
	Candidate     model.BrowserImportCandidate
	ImportPDF     bool
	Tags          []string
}

type BrowserImportResult struct {
	Status string
	Paper  model.Paper
}

type ImportProgress struct {
	Stage           string
	Message         string
	DownloadedBytes int64
	TotalBytes      int64
}

type ImportProgressReporter func(ImportProgress)

const (
	ImportProgressStageStarted        = "started"
	ImportProgressStageDuplicate      = "duplicate"
	ImportProgressStageDownloadingPDF = "downloading_pdf"
	ImportProgressStageDownloadedPDF  = "downloaded_pdf"
	ImportProgressStageSaving         = "saving"
	ImportProgressStageMetadataOnly   = "metadata_only"
	ImportProgressStageCompleted      = "completed"
)

type PDFDownloader interface {
	DownloadWithProgress(context.Context, string, pdfdownload.ProgressReporter) (pdfdownload.DownloadedPDF, error)
}

func NewService(dbManager *sqlite.LibraryDBManager) *Service {
	return &Service{
		dbManager:  dbManager,
		downloader: pdfdownload.NewHTTPDownloader(nil),
	}
}

func NewServiceWithDownloader(dbManager *sqlite.LibraryDBManager, downloader PDFDownloader) *Service {
	return &Service{
		dbManager:  dbManager,
		downloader: downloader,
	}
}

func (s *Service) ListPapers(
	ctx context.Context,
	libraryRoot string,
	filter ListFilter,
) ([]model.Paper, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return nil, err
	}
	return repository.ListPapers(ctx, sqlite.ListPapersFilter{
		DirectoryPath: filter.DirectoryPath,
		HasDirectory:  filter.HasDirectory,
		Query:         filter.Query,
		TagIDs:        filter.TagIDs,
	})
}

func (s *Service) GetPaper(
	ctx context.Context,
	libraryRoot string,
	paperID string,
) (model.Paper, bool, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}

func (s *Service) CreatePaperFromLocalPDF(
	ctx context.Context,
	input CreateFromLocalPDFInput,
) (model.Paper, error) {
	root, err := model.NewLibraryRoot(input.LibraryRoot)
	if err != nil {
		return model.Paper{}, err
	}
	if input.SourcePath == "" {
		return model.Paper{}, errRequired("source path")
	}

	pdfPath, err := s.copyPDFIfNeeded(root, input.SourcePath, input.DirectoryPath)
	if err != nil {
		return model.Paper{}, err
	}

	repository, err := s.repositoryForRoot(ctx, root)
	if err != nil {
		return model.Paper{}, err
	}
	return repository.CreatePaper(ctx, sqlite.CreatePaperInput{
		Title:         input.Title,
		Authors:       input.Authors,
		Abstract:      input.Abstract,
		PublishedYear: input.PublishedYear,
		Venue:         input.Venue,
		DOI:           input.DOI,
		ArxivID:       input.ArxivID,
		URL:           input.URL,
		PDFPath:       pdfPath,
		DirectoryPath: directoryPathForPDF(pdfPath),
	})
}

func (s *Service) SaveNote(
	ctx context.Context,
	libraryRoot string,
	paperID string,
	content string,
) (model.Paper, bool, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.SaveNote(ctx, paperID, content)
}

func (s *Service) ImportBrowserPaper(
	ctx context.Context,
	input BrowserImportInput,
) (BrowserImportResult, error) {
	return s.importBrowserPaper(ctx, input, nil)
}

func (s *Service) ImportBrowserPaperWithProgress(
	ctx context.Context,
	input BrowserImportInput,
	report ImportProgressReporter,
) (BrowserImportResult, error) {
	return s.importBrowserPaper(ctx, input, report)
}

func (s *Service) importBrowserPaper(
	ctx context.Context,
	input BrowserImportInput,
	report ImportProgressReporter,
) (BrowserImportResult, error) {
	reportImportProgress(report, ImportProgress{Stage: ImportProgressStageStarted})
	root, err := model.NewLibraryRoot(input.LibraryRoot)
	if err != nil {
		return BrowserImportResult{}, err
	}
	repository, err := s.repositoryForRoot(ctx, root)
	if err != nil {
		return BrowserImportResult{}, err
	}

	existing, ok, err := repository.GetPaperByIdentifiers(ctx, input.Candidate.DOI, input.Candidate.ArxivID)
	if err != nil {
		return BrowserImportResult{}, err
	}
	if ok {
		reportImportProgress(report, ImportProgress{Stage: ImportProgressStageDuplicate})
		return BrowserImportResult{Status: string(model.BrowserImportStatusDuplicate), Paper: existing}, nil
	}

	pdfPath := ""
	status := string(model.BrowserImportStatusMetadataOnly)
	if input.ImportPDF && input.Candidate.PDFURL != "" {
		downloaded, err := s.downloader.DownloadWithProgress(ctx, input.Candidate.PDFURL, func(progress pdfdownload.Progress) {
			reportImportProgress(report, ImportProgress{
				Stage:           ImportProgressStageDownloadingPDF,
				DownloadedBytes: progress.DownloadedBytes,
				TotalBytes:      progress.TotalBytes,
			})
		})
		if err == nil {
			reportImportProgress(report, ImportProgress{
				Stage:           ImportProgressStageDownloadedPDF,
				DownloadedBytes: int64(len(downloaded.Bytes)),
				TotalBytes:      int64(len(downloaded.Bytes)),
			})
			pdfPath, err = s.saveDownloadedPDF(root, input.DirectoryPath, downloaded)
			if err != nil {
				return BrowserImportResult{}, err
			}
			status = string(model.BrowserImportStatusCreated)
		} else {
			reportImportProgress(report, ImportProgress{
				Stage:   ImportProgressStageMetadataOnly,
				Message: err.Error(),
			})
		}
	}

	reportImportProgress(report, ImportProgress{Stage: ImportProgressStageSaving})
	paper, err := repository.CreatePaper(ctx, sqlite.CreatePaperInput{
		Title:         input.Candidate.Title,
		Authors:       input.Candidate.Authors,
		Abstract:      input.Candidate.Abstract,
		PublishedYear: input.Candidate.PublishedYear,
		Venue:         input.Candidate.Venue,
		DOI:           input.Candidate.DOI,
		ArxivID:       input.Candidate.ArxivID,
		URL:           input.Candidate.URL,
		PDFPath:       pdfPath,
		DirectoryPath: input.DirectoryPath,
	})
	if err != nil {
		return BrowserImportResult{}, err
	}
	for _, tagName := range input.Tags {
		tag, err := repository.UpsertTag(ctx, tagName, "")
		if err != nil {
			return BrowserImportResult{}, err
		}
		paper, _, err = repository.AttachTag(ctx, paper.ID, tag.ID)
		if err != nil {
			return BrowserImportResult{}, err
		}
	}

	return BrowserImportResult{Status: status, Paper: paper}, nil
}

func reportImportProgress(report ImportProgressReporter, progress ImportProgress) {
	if report != nil {
		report(progress)
	}
}

func (s *Service) ListTags(ctx context.Context, libraryRoot string) ([]model.PaperTag, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return nil, err
	}
	return repository.ListTags(ctx)
}

func (s *Service) UpsertTag(
	ctx context.Context,
	libraryRoot string,
	name string,
	color string,
) (model.PaperTag, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return model.PaperTag{}, err
	}
	return repository.UpsertTag(ctx, name, color)
}

func (s *Service) AttachTag(
	ctx context.Context,
	libraryRoot string,
	paperID string,
	tagID string,
) (model.Paper, bool, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.AttachTag(ctx, paperID, tagID)
}

func (s *Service) DetachTag(
	ctx context.Context,
	libraryRoot string,
	paperID string,
	tagID string,
) (model.Paper, bool, error) {
	repository, err := s.repository(ctx, libraryRoot)
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.DetachTag(ctx, paperID, tagID)
}

func (s *Service) LoadPDFBytes(
	ctx context.Context,
	libraryRoot string,
	pdfPath string,
) ([]byte, error) {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return nil, err
	}
	if pdfPath == "" {
		return nil, errRequired("pdf path")
	}
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	return os.ReadFile(filepath.Join(root.String(), filepath.FromSlash(pdfPath)))
}

func (s *Service) repository(ctx context.Context, libraryRoot string) (*sqlite.PaperRepository, error) {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return nil, err
	}
	return s.repositoryForRoot(ctx, root)
}

func (s *Service) repositoryForRoot(
	ctx context.Context,
	root model.LibraryRoot,
) (*sqlite.PaperRepository, error) {
	db, err := s.dbManager.OpenLibrary(ctx, root)
	if err != nil {
		return nil, err
	}
	return sqlite.NewPaperRepository(db), nil
}

func (s *Service) copyPDFIfNeeded(
	root model.LibraryRoot,
	sourcePath string,
	directoryPath string,
) (string, error) {
	sourceAbsolute, err := filepath.Abs(sourcePath)
	if err != nil {
		return "", err
	}
	rootAbsolute := root.String()
	if isInside(rootAbsolute, sourceAbsolute) {
		return toRelativeSlash(rootAbsolute, sourceAbsolute), nil
	}

	targetDir := filepath.Join(rootAbsolute, "papers")
	if directoryPath != "" {
		targetDir = filepath.Join(rootAbsolute, filepath.FromSlash(directoryPath))
	}
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return "", err
	}
	targetPath := nextAvailablePath(targetDir, filepath.Base(sourceAbsolute))
	if err := copyFile(sourceAbsolute, targetPath); err != nil {
		return "", err
	}
	return toRelativeSlash(rootAbsolute, targetPath), nil
}

func (s *Service) saveDownloadedPDF(
	root model.LibraryRoot,
	directoryPath string,
	downloaded pdfdownload.DownloadedPDF,
) (string, error) {
	targetDir := filepath.Join(root.String(), "papers")
	if directoryPath != "" {
		targetDir = filepath.Join(root.String(), filepath.FromSlash(directoryPath))
	}
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return "", err
	}
	targetPath := nextAvailablePath(targetDir, downloaded.FileName)
	if err := os.WriteFile(targetPath, downloaded.Bytes, 0o644); err != nil {
		return "", err
	}
	return toRelativeSlash(root.String(), targetPath), nil
}

func isInside(root string, path string) bool {
	relative, err := filepath.Rel(root, path)
	return err == nil && (relative == "." || (!filepath.IsAbs(relative) && relative != ".." && !startsWithDotDot(relative)))
}

func startsWithDotDot(value string) bool {
	return len(value) > 3 && value[:3] == ".."+string(filepath.Separator)
}

func toRelativeSlash(root string, path string) string {
	relative, _ := filepath.Rel(root, path)
	return filepath.ToSlash(relative)
}

func nextAvailablePath(directory string, fileName string) string {
	candidate := filepath.Join(directory, fileName)
	extension := filepath.Ext(fileName)
	baseName := fileName[:len(fileName)-len(extension)]
	counter := 2
	for {
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
		candidate = filepath.Join(directory, fmt.Sprintf("%s %d%s", baseName, counter, extension))
		counter++
	}
}

func copyFile(sourcePath string, targetPath string) error {
	bytes, err := os.ReadFile(sourcePath)
	if err != nil {
		return err
	}
	return os.WriteFile(targetPath, bytes, 0o644)
}

func directoryPathForPDF(pdfPath string) string {
	dir := filepath.ToSlash(filepath.Dir(pdfPath))
	if dir == "." {
		return ""
	}
	return dir
}

func errRequired(field string) error {
	return &requiredFieldError{field: field}
}

type requiredFieldError struct {
	field string
}

func (err *requiredFieldError) Error() string {
	return err.field + " is required"
}
