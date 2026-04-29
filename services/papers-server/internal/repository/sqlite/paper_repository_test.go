package sqlite

import (
	"context"
	"testing"
)

func TestPaperRepositoryCreateListAndGetPaper(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "creates a paper and reads it with authors and note"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			repository := newTestPaperRepository(t, ctx)

			created, err := repository.CreatePaper(ctx, CreatePaperInput{
				Title:         "A paper",
				Authors:       []string{"Alice", "Bob"},
				Abstract:      "Abstract",
				PublishedYear: 2024,
				Venue:         "Journal",
				DOI:           "10.1000/example",
				PDFPath:       "papers/a.pdf",
				DirectoryPath: "papers",
				NoteContent:   "note",
			})
			if err != nil {
				t.Fatalf("CreatePaper() error = %v", err)
			}

			got, ok, err := repository.GetPaper(ctx, created.ID)
			if err != nil {
				t.Fatalf("GetPaper() error = %v", err)
			}
			if !ok {
				t.Fatal("GetPaper() ok = false, want true")
			}
			if got.Title != "A paper" || got.NoteContent != "note" || len(got.Authors) != 2 {
				t.Fatalf("GetPaper() = %+v", got)
			}

			list, err := repository.ListPapers(ctx, ListPapersFilter{Query: "Alice"})
			if err != nil {
				t.Fatalf("ListPapers() error = %v", err)
			}
			if len(list) != 1 || list[0].ID != created.ID {
				t.Fatalf("ListPapers() = %+v, want created paper", list)
			}
		})
	}
}

func TestPaperRepositoryDuplicateDetection(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "detects duplicates by identifiers and pdf path"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			repository := newTestPaperRepository(t, ctx)

			created, err := repository.CreatePaper(ctx, CreatePaperInput{
				Title:   "A paper",
				DOI:     "10.1000/example",
				ArxivID: "2401.12345",
				PDFPath: "papers/a.pdf",
			})
			if err != nil {
				t.Fatalf("CreatePaper() error = %v", err)
			}

			byID, ok, err := repository.GetPaperByIdentifiers(ctx, "10.1000/example", "")
			if err != nil {
				t.Fatalf("GetPaperByIdentifiers() error = %v", err)
			}
			if !ok || byID.ID != created.ID {
				t.Fatalf("GetPaperByIdentifiers() = %+v, %v; want created", byID, ok)
			}

			byPDF, ok, err := repository.GetPaperByPDFPath(ctx, "papers/a.pdf")
			if err != nil {
				t.Fatalf("GetPaperByPDFPath() error = %v", err)
			}
			if !ok || byPDF.ID != created.ID {
				t.Fatalf("GetPaperByPDFPath() = %+v, %v; want created", byPDF, ok)
			}
		})
	}
}

func newTestPaperRepository(t *testing.T, ctx context.Context) *PaperRepository {
	t.Helper()

	manager := NewLibraryDBManager()
	root := newTestLibraryRoot(t, "library")
	t.Cleanup(func() {
		closeManager(t, manager)
	})

	db, err := manager.OpenLibrary(ctx, root)
	if err != nil {
		t.Fatalf("OpenLibrary() error = %v", err)
	}
	return NewPaperRepository(db)
}
