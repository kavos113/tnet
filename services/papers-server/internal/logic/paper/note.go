package paper

import (
	"context"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

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
