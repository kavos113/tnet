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

type fakePaperUsecase struct{}

func (fakePaperUsecase) ListPapers(context.Context, string, paper.ListFilter) ([]model.Paper, error) {
	return nil, nil
}

func (fakePaperUsecase) GetPaper(context.Context, string, string) (model.Paper, bool, error) {
	return model.Paper{}, false, nil
}

func (fakePaperUsecase) CreatePaperFromLocalPDF(context.Context, paper.CreateFromLocalPDFInput) (model.Paper, error) {
	return model.Paper{}, nil
}

func (fakePaperUsecase) CreatePaperFromPDFBytes(context.Context, paper.CreateFromPDFBytesInput) (model.Paper, error) {
	return model.Paper{}, nil
}

func (fakePaperUsecase) ImportBrowserPaper(context.Context, paper.BrowserImportInput) (paper.BrowserImportResult, error) {
	return paper.BrowserImportResult{}, nil
}

func (fakePaperUsecase) ImportBrowserPaperWithProgress(
	_ context.Context,
	_ paper.BrowserImportInput,
	report paper.ImportProgressReporter,
) (paper.BrowserImportResult, error) {
	report(paper.ImportProgress{
		Stage:           paper.ImportProgressStageDownloadingPDF,
		DownloadedBytes: 5,
		TotalBytes:      10,
	})
	return paper.BrowserImportResult{
		Status: "created",
		Paper:  model.Paper{ID: "paper-1", Title: "Paper"},
	}, nil
}

func (fakePaperUsecase) SaveNote(context.Context, string, string, string) (model.Paper, bool, error) {
	return model.Paper{}, false, nil
}

func TestPaperHandlerImportBrowserPaperWithProgress(t *testing.T) {
	_, handler := NewPaperHandler(fakePaperUsecase{})
	server := httptest.NewServer(handler)
	defer server.Close()
	client := papersv1connect.NewPaperServiceClient(server.Client(), server.URL)

	stream, err := client.ImportBrowserPaperWithProgress(
		context.Background(),
		connect.NewRequest(&papersv1.ImportBrowserPaperRequest{LibraryRoot: "C:/papers"}),
	)
	if err != nil {
		t.Fatalf("ImportBrowserPaperWithProgress() error = %v", err)
	}

	var stages []string
	var finalResponse *papersv1.ImportBrowserPaperResponse
	for stream.Receive() {
		message := stream.Msg()
		stages = append(stages, message.Stage)
		if message.Response != nil {
			finalResponse = message.Response
		}
	}
	if err := stream.Err(); err != nil {
		t.Fatalf("stream error = %v", err)
	}
	if !equalServerStrings(stages, []string{paper.ImportProgressStageDownloadingPDF, paper.ImportProgressStageCompleted}) {
		t.Fatalf("stages = %v, want downloading and completed", stages)
	}
	if finalResponse == nil || finalResponse.Status != "created" || finalResponse.Paper.GetId() != "paper-1" {
		t.Fatalf("final response = %+v, want created paper-1", finalResponse)
	}
}

func equalServerStrings(left []string, right []string) bool {
	if len(left) != len(right) {
		return false
	}
	for index := range left {
		if left[index] != right[index] {
			return false
		}
	}
	return true
}
