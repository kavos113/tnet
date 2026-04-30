package server

import (
	"context"
	"net/http/httptest"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type fakePaperUsecase struct {
	createdFromBytes paper.CreateFromPDFBytesInput
	papers           []model.Paper
	paper            model.Paper
	ok               bool
	err              error
}

func (usecase fakePaperUsecase) ListPapers(context.Context, string, paper.ListFilter) ([]model.Paper, error) {
	return usecase.papers, usecase.err
}

func (usecase fakePaperUsecase) GetPaper(context.Context, string, string) (model.Paper, bool, error) {
	return usecase.paper, usecase.ok, usecase.err
}

func (usecase fakePaperUsecase) CreatePaperFromLocalPDF(context.Context, paper.CreateFromLocalPDFInput) (paper.ImportResult, error) {
	return paper.ImportResult{Paper: usecase.paper}, usecase.err
}

func (usecase *fakePaperUsecase) CreatePaperFromPDFBytes(
	_ context.Context,
	input paper.CreateFromPDFBytesInput,
) (paper.ImportResult, error) {
	usecase.createdFromBytes = input
	return paper.ImportResult{
		Paper: model.Paper{
			ID:            "paper-1",
			Title:         input.Title,
			Tags:          input.Tags,
			PDFPath:       "papers/" + input.FileName,
			DirectoryPath: input.DirectoryPath,
		},
	}, nil
}

func (usecase fakePaperUsecase) SaveNote(context.Context, string, string, string) (model.Paper, bool, error) {
	return usecase.paper, usecase.ok, usecase.err
}

func TestPaperHandlerCreatePaperFromPdfBytes(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "maps request to create from bytes usecase"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			usecase := &fakePaperUsecase{}
			_, handler := NewPaperHandler(usecase)
			server := httptest.NewServer(handler)
			defer server.Close()
			client := papersv1connect.NewPaperServiceClient(server.Client(), server.URL)

			response, err := client.CreatePaperFromPdfBytes(
				context.Background(),
				connect.NewRequest(&papersv1.CreatePaperFromPdfBytesRequest{
					LibraryRoot:   "C:/papers",
					DirectoryPath: "articles",
					FileName:      "paper.pdf",
					PdfBytes:      []byte("pdf"),
					Title:         "Paper",
					Authors:       []string{"Alice"},
					PublishedYear: 2026,
					Venue:         "Journal",
					Doi:           "10.1000/paper",
					ArxivId:       "2601.00001",
					Url:           "https://example.test/paper",
					Tags:          []string{"ai"},
				}),
			)
			if err != nil {
				t.Fatalf("CreatePaperFromPdfBytes() error = %v", err)
			}

			if response.Msg.GetPaper().GetId() != "paper-1" {
				t.Fatalf("paper ID = %q, want paper-1", response.Msg.GetPaper().GetId())
			}
			if usecase.createdFromBytes.LibraryRoot != "C:/papers" ||
				usecase.createdFromBytes.DirectoryPath != "articles" ||
				usecase.createdFromBytes.FileName != "paper.pdf" ||
				usecase.createdFromBytes.Title != "Paper" ||
				len(usecase.createdFromBytes.Tags) != 1 ||
				usecase.createdFromBytes.Tags[0] != "ai" {
				t.Fatalf("createdFromBytes = %+v", usecase.createdFromBytes)
			}
		})
	}
}

func TestPaperHandlerListGetAndSaveNote(t *testing.T) {
	testcases := []struct {
		name string
		run  func(t *testing.T, handler *PaperHandler)
	}{
		{
			name: "lists paper summaries",
			run: func(t *testing.T, handler *PaperHandler) {
				t.Helper()
				response, err := handler.ListPapers(
					context.Background(),
					connect.NewRequest(&papersv1.ListPapersRequest{LibraryRoot: "C:/papers", Query: "Paper"}),
				)
				if err != nil {
					t.Fatalf("ListPapers() error = %v", err)
				}
				if len(response.Msg.Papers) != 1 || response.Msg.Papers[0].Title != "Paper" {
					t.Fatalf("ListPapers() = %+v", response.Msg)
				}
			},
		},
		{
			name: "gets paper detail",
			run: func(t *testing.T, handler *PaperHandler) {
				t.Helper()
				response, err := handler.GetPaper(
					context.Background(),
					connect.NewRequest(&papersv1.GetPaperRequest{LibraryRoot: "C:/papers", PaperId: "paper-1"}),
				)
				if err != nil {
					t.Fatalf("GetPaper() error = %v", err)
				}
				if response.Msg.Paper == nil || response.Msg.Paper.Id != "paper-1" {
					t.Fatalf("GetPaper() = %+v", response.Msg)
				}
			},
		},
		{
			name: "saves note",
			run: func(t *testing.T, handler *PaperHandler) {
				t.Helper()
				response, err := handler.SaveNote(
					context.Background(),
					connect.NewRequest(&papersv1.SaveNoteRequest{LibraryRoot: "C:/papers", PaperId: "paper-1", Content: "note"}),
				)
				if err != nil {
					t.Fatalf("SaveNote() error = %v", err)
				}
				if response.Msg.Paper == nil || response.Msg.Paper.NoteContent != "note" {
					t.Fatalf("SaveNote() = %+v", response.Msg)
				}
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &PaperHandler{u: &fakePaperUsecase{
				papers: []model.Paper{{ID: "paper-1", Title: "Paper", PDFPath: "papers/a.pdf"}},
				paper:  model.Paper{ID: "paper-1", Title: "Paper", NoteContent: "note"},
				ok:     true,
			}}
			testcase.run(t, handler)
		})
	}
}
