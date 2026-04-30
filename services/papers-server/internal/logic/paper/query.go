package paper

import (
	"context"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type ListFilter struct {
	DirectoryPath string
	HasDirectory  bool
	Query         string
	TagIDs        []string
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
	return repository.ListPapers(ctx, ListFilter{
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
