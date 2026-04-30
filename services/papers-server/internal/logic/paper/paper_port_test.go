package paper_test

import (
	"context"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	mockpaper "github.com/kavos113/tnet/services/papers-server/internal/logic/paper/mock"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
	"go.uber.org/mock/gomock"
)

func TestServiceListPapersUsesRepositoryPort(t *testing.T) {
	testcases := []struct {
		name   string
		filter paper.ListFilter
		want   []model.Paper
	}{
		{
			name: "passes filter to repository",
			filter: paper.ListFilter{
				DirectoryPath: "papers",
				HasDirectory:  true,
				Query:         "deep learning",
				TagIDs:        []string{"tag-1"},
			},
			want: []model.Paper{{ID: "paper-1", Title: "Deep Learning"}},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			libraryRoot := t.TempDir()
			root, err := model.NewLibraryRoot(libraryRoot)
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}

			ctrl := gomock.NewController(t)
			store := mockpaper.NewMockStore(ctrl)
			repository := mockpaper.NewMockRepository(ctrl)
			store.EXPECT().OpenPaperRepository(ctx, root).Return(repository, nil)
			repository.EXPECT().ListPapers(ctx, testcase.filter).Return(testcase.want, nil)

			service := paper.NewService(store)
			got, err := service.ListPapers(ctx, libraryRoot, testcase.filter)
			if err != nil {
				t.Fatalf("ListPapers() error = %v", err)
			}
			if len(got) != len(testcase.want) || got[0].ID != testcase.want[0].ID {
				t.Fatalf("ListPapers() = %#v, want %#v", got, testcase.want)
			}
		})
	}
}

func TestServiceListPapersRejectsInvalidLibraryRootBeforeOpeningStore(t *testing.T) {
	testcases := []struct {
		name        string
		libraryRoot string
	}{
		{
			name:        "empty library root",
			libraryRoot: " ",
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)
			store := mockpaper.NewMockStore(ctrl)
			service := paper.NewService(store)

			_, err := service.ListPapers(context.Background(), testcase.libraryRoot, paper.ListFilter{})
			if err == nil {
				t.Fatal("ListPapers() error = nil, want error")
			}
		})
	}
}
