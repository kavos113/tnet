package paper_test

import (
	"context"
	"os"
	"path/filepath"
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

func TestServiceCreatePaperFromPDFBytesUsesRepositoryPort(t *testing.T) {
	testcases := []struct {
		name string
		run  func(t *testing.T, service *paper.Service, libraryRoot string) paper.ImportResult
	}{
		{
			name: "returns identifier duplicate before writing pdf",
			run: func(t *testing.T, service *paper.Service, libraryRoot string) paper.ImportResult {
				t.Helper()
				result, err := service.CreatePaperFromPDFBytes(context.Background(), paper.CreateFromPDFBytesInput{
					LibraryRoot: libraryRoot,
					FileName:    "paper.pdf",
					Bytes:       []byte("pdf"),
					Title:       "Paper",
					DOI:         "10.1000/example",
				})
				if err != nil {
					t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
				}
				return result
			},
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
			duplicate := model.Paper{ID: "paper-1", Title: "Existing", DOI: "10.1000/example"}
			store.EXPECT().OpenPaperRepository(ctx, root).Return(repository, nil)
			repository.EXPECT().GetPaperByIdentifiers(ctx, "10.1000/example", "").Return(duplicate, true, nil)

			service := paper.NewService(store)
			result := testcase.run(t, service, libraryRoot)
			if !result.AlreadyExists || result.DuplicateField != "doi" || result.Paper.ID != duplicate.ID {
				t.Fatalf("result = %+v, want DOI duplicate", result)
			}
		})
	}
}

func TestServiceCreatePaperFromPDFBytesCreatesPaperAndTagsThroughRepositoryPort(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "creates paper and attaches import tags"},
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
			duplicateRepository := mockpaper.NewMockRepository(ctrl)
			createRepository := mockpaper.NewMockRepository(ctrl)
			created := model.Paper{ID: "paper-1", Title: "Paper", PDFPath: "papers/paper.pdf", DirectoryPath: "papers"}
			tag := model.PaperTag{ID: "tag-1", Name: "ai"}
			tagged := created
			tagged.Tags = []string{"ai"}

			gomock.InOrder(
				store.EXPECT().OpenPaperRepository(ctx, root).Return(duplicateRepository, nil),
				duplicateRepository.EXPECT().GetPaperByIdentifiers(ctx, "", "").Return(model.Paper{}, false, nil),
				store.EXPECT().OpenPaperRepository(ctx, root).Return(createRepository, nil),
				createRepository.EXPECT().GetPaperByIdentifiers(ctx, "", "").Return(model.Paper{}, false, nil),
				createRepository.EXPECT().GetPaperByPDFPath(ctx, "papers/paper.pdf").Return(model.Paper{}, false, nil),
				createRepository.EXPECT().CreatePaper(ctx, gomock.Any()).Return(created, nil),
				createRepository.EXPECT().UpsertTag(ctx, "ai", "").Return(tag, nil),
				createRepository.EXPECT().AttachTag(ctx, created.ID, tag.ID).Return(tagged, true, nil),
			)

			service := paper.NewService(store)
			result, err := service.CreatePaperFromPDFBytes(ctx, paper.CreateFromPDFBytesInput{
				LibraryRoot: libraryRoot,
				FileName:    "paper.pdf",
				Bytes:       []byte("pdf"),
				Title:       "Paper",
				Tags:        []string{"ai"},
			})
			if err != nil {
				t.Fatalf("CreatePaperFromPDFBytes() error = %v", err)
			}
			if result.AlreadyExists || len(result.Paper.Tags) != 1 || result.Paper.Tags[0] != "ai" {
				t.Fatalf("result = %+v, want tagged imported paper", result)
			}
		})
	}
}

func TestServiceNoteTagAndPDFUsecases(t *testing.T) {
	testcases := []struct {
		name string
		run  func(t *testing.T, ctx context.Context, service *paper.Service, libraryRoot string, repository *mockpaper.MockRepository)
	}{
		{
			name: "saves note through repository",
			run: func(t *testing.T, ctx context.Context, service *paper.Service, libraryRoot string, repository *mockpaper.MockRepository) {
				t.Helper()
				want := model.Paper{ID: "paper-1", NoteContent: "note"}
				repository.EXPECT().SaveNote(ctx, "paper-1", "note").Return(want, true, nil)
				got, ok, err := service.SaveNote(ctx, libraryRoot, "paper-1", "note")
				if err != nil || !ok || got.NoteContent != "note" {
					t.Fatalf("SaveNote() = %+v, %v, %v; want saved note", got, ok, err)
				}
			},
		},
		{
			name: "lists tags through repository",
			run: func(t *testing.T, ctx context.Context, service *paper.Service, libraryRoot string, repository *mockpaper.MockRepository) {
				t.Helper()
				repository.EXPECT().ListTags(ctx).Return([]model.PaperTag{{ID: "tag-1", Name: "ai"}}, nil)
				got, err := service.ListTags(ctx, libraryRoot)
				if err != nil || len(got) != 1 || got[0].Name != "ai" {
					t.Fatalf("ListTags() = %+v, %v; want ai tag", got, err)
				}
			},
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

			service := paper.NewService(store)
			testcase.run(t, ctx, service, libraryRoot, repository)
		})
	}
}

func TestServiceLoadPDFBytes(t *testing.T) {
	testcases := []struct {
		name    string
		pdfPath string
		setup   func(t *testing.T, libraryRoot string)
		want    string
		wantErr bool
	}{
		{
			name:    "loads relative PDF",
			pdfPath: "papers/a.pdf",
			setup: func(t *testing.T, libraryRoot string) {
				t.Helper()
				pdfPath := filepath.Join(libraryRoot, "papers", "a.pdf")
				if err := os.MkdirAll(filepath.Dir(pdfPath), 0o755); err != nil {
					t.Fatalf("MkdirAll() error = %v", err)
				}
				if err := os.WriteFile(pdfPath, []byte("pdf"), 0o644); err != nil {
					t.Fatalf("WriteFile() error = %v", err)
				}
			},
			want: "pdf",
		},
		{
			name:    "rejects empty path",
			pdfPath: "",
			wantErr: true,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			libraryRoot := t.TempDir()
			if testcase.setup != nil {
				testcase.setup(t, libraryRoot)
			}
			got, err := paper.NewService(nil).LoadPDFBytes(context.Background(), libraryRoot, testcase.pdfPath)
			if testcase.wantErr {
				if err == nil {
					t.Fatal("LoadPDFBytes() error = nil, want error")
				}
				return
			}
			if err != nil {
				t.Fatalf("LoadPDFBytes() error = %v", err)
			}
			if string(got) != testcase.want {
				t.Fatalf("LoadPDFBytes() = %q, want %q", string(got), testcase.want)
			}
		})
	}
}
