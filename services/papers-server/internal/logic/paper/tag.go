package paper

import (
	"context"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

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
