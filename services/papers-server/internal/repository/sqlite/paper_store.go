package sqlite

import (
	"context"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type PaperStore struct {
	dbManager *LibraryDBManager
}

func NewPaperStore(dbManager *LibraryDBManager) *PaperStore {
	return &PaperStore{dbManager: dbManager}
}

func (store *PaperStore) OpenPaperRepository(
	ctx context.Context,
	libraryRoot model.LibraryRoot,
) (paper.Repository, error) {
	db, err := store.dbManager.OpenLibrary(ctx, libraryRoot)
	if err != nil {
		return nil, err
	}
	return NewPaperRepository(db), nil
}
