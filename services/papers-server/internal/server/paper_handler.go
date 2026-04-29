package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type PaperUsecase interface {
	ListPapers(context.Context, string, paper.ListFilter) ([]model.Paper, error)
	GetPaper(context.Context, string, string) (model.Paper, bool, error)
	CreatePaperFromLocalPDF(context.Context, paper.CreateFromLocalPDFInput) (model.Paper, error)
	CreatePaperFromPDFBytes(context.Context, paper.CreateFromPDFBytesInput) (model.Paper, error)
	ImportBrowserPaper(context.Context, paper.BrowserImportInput) (paper.BrowserImportResult, error)
	ImportBrowserPaperWithProgress(context.Context, paper.BrowserImportInput, paper.ImportProgressReporter) (paper.BrowserImportResult, error)
	SaveNote(context.Context, string, string, string) (model.Paper, bool, error)
}

type PaperHandler struct {
	u PaperUsecase
}

func NewPaperHandler(u PaperUsecase) (string, http.Handler) {
	return papersv1connect.NewPaperServiceHandler(&PaperHandler{u: u})
}

func (h *PaperHandler) ListPapers(
	ctx context.Context,
	request *connect.Request[papersv1.ListPapersRequest],
) (*connect.Response[papersv1.ListPapersResponse], error) {
	papers, err := h.u.ListPapers(ctx, request.Msg.LibraryRoot, paper.ListFilter{
		DirectoryPath: request.Msg.DirectoryPath,
		HasDirectory:  request.Msg.DirectoryPath != "",
		Query:         request.Msg.Query,
		TagIDs:        request.Msg.TagIds,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	response := &papersv1.ListPapersResponse{}
	for _, item := range papers {
		response.Papers = append(response.Papers, toProtoPaperSummary(item))
	}
	return connect.NewResponse(response), nil
}

func (h *PaperHandler) GetPaper(
	ctx context.Context,
	request *connect.Request[papersv1.GetPaperRequest],
) (*connect.Response[papersv1.GetPaperResponse], error) {
	paper, ok, err := h.u.GetPaper(ctx, request.Msg.LibraryRoot, request.Msg.PaperId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if !ok {
		return connect.NewResponse(&papersv1.GetPaperResponse{}), nil
	}
	return connect.NewResponse(&papersv1.GetPaperResponse{Paper: toProtoPaperDetail(paper)}), nil
}

func (h *PaperHandler) CreatePaperFromLocalPdf(
	ctx context.Context,
	request *connect.Request[papersv1.CreatePaperFromLocalPdfRequest],
) (*connect.Response[papersv1.PaperDetail], error) {
	paper, err := h.u.CreatePaperFromLocalPDF(ctx, paper.CreateFromLocalPDFInput{
		LibraryRoot:   request.Msg.LibraryRoot,
		SourcePath:    request.Msg.SourcePath,
		Title:         request.Msg.Title,
		Authors:       request.Msg.Authors,
		Abstract:      request.Msg.Abstract,
		PublishedYear: request.Msg.PublishedYear,
		Venue:         request.Msg.Venue,
		DOI:           request.Msg.Doi,
		ArxivID:       request.Msg.ArxivId,
		URL:           request.Msg.Url,
		DirectoryPath: request.Msg.DirectoryPath,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoPaperDetail(paper)), nil
}

func (h *PaperHandler) CreatePaperFromPdfBytes(
	ctx context.Context,
	request *connect.Request[papersv1.CreatePaperFromPdfBytesRequest],
) (*connect.Response[papersv1.PaperDetail], error) {
	paper, err := h.u.CreatePaperFromPDFBytes(ctx, paper.CreateFromPDFBytesInput{
		LibraryRoot:   request.Msg.LibraryRoot,
		FileName:      request.Msg.FileName,
		Bytes:         request.Msg.PdfBytes,
		Title:         request.Msg.Title,
		Authors:       request.Msg.Authors,
		Abstract:      request.Msg.Abstract,
		PublishedYear: request.Msg.PublishedYear,
		Venue:         request.Msg.Venue,
		DOI:           request.Msg.Doi,
		ArxivID:       request.Msg.ArxivId,
		URL:           request.Msg.Url,
		DirectoryPath: request.Msg.DirectoryPath,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoPaperDetail(paper)), nil
}

func (h *PaperHandler) ImportBrowserPaper(
	ctx context.Context,
	request *connect.Request[papersv1.ImportBrowserPaperRequest],
) (*connect.Response[papersv1.ImportBrowserPaperResponse], error) {
	result, err := h.u.ImportBrowserPaper(ctx, fromProtoBrowserImportInput(request.Msg))
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoImportBrowserPaperResponse(result)), nil
}

func (h *PaperHandler) ImportBrowserPaperWithProgress(
	ctx context.Context,
	request *connect.Request[papersv1.ImportBrowserPaperRequest],
	stream *connect.ServerStream[papersv1.ImportBrowserPaperProgress],
) error {
	var sendErr error
	result, err := h.u.ImportBrowserPaperWithProgress(ctx, fromProtoBrowserImportInput(request.Msg), func(progress paper.ImportProgress) {
		if sendErr != nil {
			return
		}
		sendErr = stream.Send(&papersv1.ImportBrowserPaperProgress{
			Stage:           progress.Stage,
			Message:         progress.Message,
			DownloadedBytes: progress.DownloadedBytes,
			TotalBytes:      progress.TotalBytes,
		})
	})
	if sendErr != nil {
		return sendErr
	}
	if err != nil {
		return connect.NewError(connect.CodeInvalidArgument, err)
	}
	return stream.Send(&papersv1.ImportBrowserPaperProgress{
		Stage:    paper.ImportProgressStageCompleted,
		Response: toProtoImportBrowserPaperResponse(result),
	})
}

func (h *PaperHandler) SaveNote(
	ctx context.Context,
	request *connect.Request[papersv1.SaveNoteRequest],
) (*connect.Response[papersv1.GetPaperResponse], error) {
	paper, ok, err := h.u.SaveNote(ctx, request.Msg.LibraryRoot, request.Msg.PaperId, request.Msg.Content)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if !ok {
		return connect.NewResponse(&papersv1.GetPaperResponse{}), nil
	}
	return connect.NewResponse(&papersv1.GetPaperResponse{Paper: toProtoPaperDetail(paper)}), nil
}

func fromProtoBrowserCandidate(candidate *papersv1.BrowserPaperImportCandidate) model.BrowserImportCandidate {
	if candidate == nil {
		return model.BrowserImportCandidate{}
	}
	url := ""
	if candidate.Source != nil {
		url = candidate.Source.SourceUrl
	}
	return model.BrowserImportCandidate{
		URL:           url,
		Title:         candidate.Title,
		Authors:       candidate.Authors,
		Abstract:      candidate.Abstract,
		PublishedYear: candidate.PublishedYear,
		Venue:         candidate.Venue,
		DOI:           candidate.Doi,
		ArxivID:       candidate.ArxivId,
		PDFURL:        candidate.PdfUrl,
	}
}

func fromProtoBrowserImportInput(request *papersv1.ImportBrowserPaperRequest) paper.BrowserImportInput {
	return paper.BrowserImportInput{
		LibraryRoot:   request.LibraryRoot,
		DirectoryPath: request.DirectoryPath,
		Candidate:     fromProtoBrowserCandidate(request.Candidate),
		ImportPDF:     request.ImportPdf,
		Tags:          request.Tags,
	}
}

func toProtoImportBrowserPaperResponse(result paper.BrowserImportResult) *papersv1.ImportBrowserPaperResponse {
	return &papersv1.ImportBrowserPaperResponse{
		Status: result.Status,
		Paper:  toProtoPaperDetail(result.Paper),
	}
}

func toProtoPaperSummary(paper model.Paper) *papersv1.PaperSummary {
	return &papersv1.PaperSummary{
		Id:            paper.ID,
		Title:         paper.Title,
		Authors:       paper.Authors,
		PublishedYear: paper.PublishedYear,
		Venue:         paper.Venue,
		Tags:          paper.Tags,
		HasPdf:        paper.PDFPath != "",
	}
}

func toProtoPaperDetail(paper model.Paper) *papersv1.PaperDetail {
	return &papersv1.PaperDetail{
		Id:            paper.ID,
		Title:         paper.Title,
		Authors:       paper.Authors,
		PublishedYear: paper.PublishedYear,
		Venue:         paper.Venue,
		Tags:          paper.Tags,
		HasPdf:        paper.PDFPath != "",
		Abstract:      paper.Abstract,
		Doi:           paper.DOI,
		ArxivId:       paper.ArxivID,
		Url:           paper.URL,
		PdfPath:       paper.PDFPath,
		DirectoryPath: paper.DirectoryPath,
		NoteContent:   paper.NoteContent,
	}
}
