package paper

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type Service struct {
	store Store
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
	Tags          []string
}

type CreateFromPDFBytesInput struct {
	LibraryRoot   string
	FileName      string
	Bytes         []byte
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	DirectoryPath string
	Tags          []string
}

type ImportResult struct {
	Paper          model.Paper
	AlreadyExists  bool
	DuplicateField string
}

type Store interface {
	OpenPaperRepository(context.Context, model.LibraryRoot) (Repository, error)
}

type Repository interface {
	CreatePaper(context.Context, CreatePaperInput) (model.Paper, error)
	ListPapers(context.Context, ListFilter) ([]model.Paper, error)
	GetPaper(context.Context, string) (model.Paper, bool, error)
	GetPaperByIdentifiers(context.Context, string, string) (model.Paper, bool, error)
	GetPaperByPDFPath(context.Context, string) (model.Paper, bool, error)
	ListTags(context.Context) ([]model.PaperTag, error)
	UpsertTag(context.Context, string, string) (model.PaperTag, error)
	AttachTag(context.Context, string, string) (model.Paper, bool, error)
	DetachTag(context.Context, string, string) (model.Paper, bool, error)
	SaveNote(context.Context, string, string) (model.Paper, bool, error)
	ListPaperAIOutputs(context.Context, string) ([]model.PaperAIOutput, error)
	SavePaperAIOutput(context.Context, model.PaperAIOutput) (model.PaperAIOutput, error)
}

type CreatePaperInput struct {
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	PDFPath       string
	DirectoryPath string
	NoteContent   string
}

func NewService(store Store) *Service {
	return &Service{store: store}
}

func (s *Service) CreatePaperFromLocalPDF(
	ctx context.Context,
	input CreateFromLocalPDFInput,
) (ImportResult, error) {
	root, err := model.NewLibraryRoot(input.LibraryRoot)
	if err != nil {
		return ImportResult{}, err
	}
	if input.SourcePath == "" {
		return ImportResult{}, errRequired("source path")
	}

	pdfPath, err := s.copyPDFIfNeeded(root, input.SourcePath, input.DirectoryPath)
	if err != nil {
		return ImportResult{}, err
	}
	return s.createPaperWithPDFPath(ctx, root, createPaperMetadata{
		Title:         input.Title,
		Authors:       input.Authors,
		Abstract:      input.Abstract,
		PublishedYear: input.PublishedYear,
		Venue:         input.Venue,
		DOI:           input.DOI,
		ArxivID:       input.ArxivID,
		URL:           input.URL,
		PDFPath:       pdfPath,
		Tags:          input.Tags,
	})
}

func (s *Service) CreatePaperFromPDFBytes(
	ctx context.Context,
	input CreateFromPDFBytesInput,
) (ImportResult, error) {
	root, err := model.NewLibraryRoot(input.LibraryRoot)
	if err != nil {
		return ImportResult{}, err
	}
	if len(input.Bytes) == 0 {
		return ImportResult{}, errRequired("pdf bytes")
	}
	if duplicate, ok, err := s.findIdentifierDuplicate(ctx, root, input.DOI, input.ArxivID); err != nil {
		return ImportResult{}, err
	} else if ok {
		return duplicate, nil
	}

	pdfPath, err := s.savePDFBytes(root, input.DirectoryPath, storedPDF{
		FileName: safePDFFileName(input.FileName),
		Bytes:    input.Bytes,
	})
	if err != nil {
		return ImportResult{}, err
	}
	return s.createPaperWithPDFPath(ctx, root, createPaperMetadata{
		Title:         input.Title,
		Authors:       input.Authors,
		Abstract:      input.Abstract,
		PublishedYear: input.PublishedYear,
		Venue:         input.Venue,
		DOI:           input.DOI,
		ArxivID:       input.ArxivID,
		URL:           input.URL,
		PDFPath:       pdfPath,
		Tags:          input.Tags,
	})
}

type createPaperMetadata struct {
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	PDFPath       string
	Tags          []string
}

func (s *Service) createPaperWithPDFPath(
	ctx context.Context,
	root model.LibraryRoot,
	metadata createPaperMetadata,
) (ImportResult, error) {
	repository, err := s.repositoryForRoot(ctx, root)
	if err != nil {
		return ImportResult{}, err
	}
	if duplicate, ok, err := findIdentifierDuplicate(ctx, repository, metadata.DOI, metadata.ArxivID); err != nil {
		return ImportResult{}, err
	} else if ok {
		return duplicate, nil
	}
	if metadata.PDFPath != "" {
		paper, ok, err := repository.GetPaperByPDFPath(ctx, metadata.PDFPath)
		if err != nil {
			return ImportResult{}, err
		}
		if ok {
			return ImportResult{Paper: paper, AlreadyExists: true, DuplicateField: "pdf_path"}, nil
		}
	}
	paper, err := repository.CreatePaper(ctx, CreatePaperInput{
		Title:         metadata.Title,
		Authors:       metadata.Authors,
		Abstract:      metadata.Abstract,
		PublishedYear: metadata.PublishedYear,
		Venue:         metadata.Venue,
		DOI:           metadata.DOI,
		ArxivID:       metadata.ArxivID,
		URL:           metadata.URL,
		PDFPath:       metadata.PDFPath,
		DirectoryPath: directoryPathForPDF(metadata.PDFPath),
	})
	if err != nil {
		return ImportResult{}, err
	}
	paper, err = attachImportTags(ctx, repository, paper, metadata.Tags)
	if err != nil {
		return ImportResult{}, err
	}
	return ImportResult{Paper: paper}, nil
}

func (s *Service) findIdentifierDuplicate(
	ctx context.Context,
	root model.LibraryRoot,
	doi string,
	arxivID string,
) (ImportResult, bool, error) {
	repository, err := s.repositoryForRoot(ctx, root)
	if err != nil {
		return ImportResult{}, false, err
	}
	return findIdentifierDuplicate(ctx, repository, doi, arxivID)
}

func findIdentifierDuplicate(
	ctx context.Context,
	repository Repository,
	doi string,
	arxivID string,
) (ImportResult, bool, error) {
	paper, ok, err := repository.GetPaperByIdentifiers(ctx, doi, arxivID)
	if err != nil || !ok {
		return ImportResult{}, false, err
	}
	duplicateField := "identifier"
	if doi != "" && paper.DOI == doi {
		duplicateField = "doi"
	} else if arxivID != "" && paper.ArxivID == arxivID {
		duplicateField = "arxiv_id"
	}
	return ImportResult{Paper: paper, AlreadyExists: true, DuplicateField: duplicateField}, true, nil
}

func attachImportTags(
	ctx context.Context,
	repository Repository,
	paper model.Paper,
	tags []string,
) (model.Paper, error) {
	updated := paper
	for _, tagName := range tags {
		tag, err := repository.UpsertTag(ctx, tagName, "")
		if err != nil {
			return model.Paper{}, err
		}
		next, ok, err := repository.AttachTag(ctx, updated.ID, tag.ID)
		if err != nil {
			return model.Paper{}, err
		}
		if ok {
			updated = next
		}
	}
	return updated, nil
}

func (s *Service) repository(ctx context.Context, libraryRoot string) (Repository, error) {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return nil, err
	}
	return s.repositoryForRoot(ctx, root)
}

func (s *Service) repositoryForRoot(
	ctx context.Context,
	root model.LibraryRoot,
) (Repository, error) {
	return s.store.OpenPaperRepository(ctx, root)
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

	normalizedDirectoryPath, err := normalizeDirectoryPath(directoryPath)
	if err != nil {
		return "", err
	}
	targetDir := filepath.Join(rootAbsolute, "papers")
	if normalizedDirectoryPath != "" {
		targetDir = filepath.Join(rootAbsolute, filepath.FromSlash(normalizedDirectoryPath))
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

type storedPDF struct {
	FileName string
	Bytes    []byte
}

func (s *Service) savePDFBytes(
	root model.LibraryRoot,
	directoryPath string,
	pdf storedPDF,
) (string, error) {
	normalizedDirectoryPath, err := normalizeDirectoryPath(directoryPath)
	if err != nil {
		return "", err
	}
	targetDir := filepath.Join(root.String(), "papers")
	if normalizedDirectoryPath != "" {
		targetDir = filepath.Join(root.String(), filepath.FromSlash(normalizedDirectoryPath))
	}
	if err := os.MkdirAll(targetDir, 0o755); err != nil {
		return "", err
	}
	targetPath := nextAvailablePath(targetDir, pdf.FileName)
	if err := os.WriteFile(targetPath, pdf.Bytes, 0o644); err != nil {
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

func safePDFFileName(fileName string) string {
	name := filepath.Base(fileName)
	if name == "." || name == string(filepath.Separator) || name == "" || !strings.HasSuffix(strings.ToLower(name), ".pdf") {
		return "paper.pdf"
	}
	return name
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

func normalizeDirectoryPath(value string) (string, error) {
	relativePath, err := model.NewRelativePath(value)
	if err != nil {
		return "", err
	}
	return relativePath.String(), nil
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
