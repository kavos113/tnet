package paper

import (
	"context"
	"os"
	"path/filepath"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

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
