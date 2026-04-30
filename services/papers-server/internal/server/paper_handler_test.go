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
}

func (fakePaperUsecase) ListPapers(context.Context, string, paper.ListFilter) ([]model.Paper, error) {
	return nil, nil
}

func (fakePaperUsecase) GetPaper(context.Context, string, string) (model.Paper, bool, error) {
	return model.Paper{}, false, nil
}

func (fakePaperUsecase) CreatePaperFromLocalPDF(context.Context, paper.CreateFromLocalPDFInput) (paper.ImportResult, error) {
	return paper.ImportResult{}, nil
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

func (fakePaperUsecase) SaveNote(context.Context, string, string, string) (model.Paper, bool, error) {
	return model.Paper{}, false, nil
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
