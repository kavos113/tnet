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
	CreatePaperFromLocalPDF(context.Context, paper.CreateFromLocalPDFInput) (paper.ImportResult, error)
	CreatePaperFromPDFBytes(context.Context, paper.CreateFromPDFBytesInput) (paper.ImportResult, error)
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
) (*connect.Response[papersv1.ImportPaperResponse], error) {
	result, err := h.u.CreatePaperFromLocalPDF(ctx, paper.CreateFromLocalPDFInput{
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
		Tags:          request.Msg.Tags,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoImportPaperResponse(result)), nil
}

func (h *PaperHandler) CreatePaperFromPdfBytes(
	ctx context.Context,
	request *connect.Request[papersv1.CreatePaperFromPdfBytesRequest],
) (*connect.Response[papersv1.ImportPaperResponse], error) {
	result, err := h.u.CreatePaperFromPDFBytes(ctx, paper.CreateFromPDFBytesInput{
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
		Tags:          request.Msg.Tags,
	})
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoImportPaperResponse(result)), nil
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

func toProtoImportPaperResponse(result paper.ImportResult) *papersv1.ImportPaperResponse {
	return &papersv1.ImportPaperResponse{
		Paper:          toProtoPaperDetail(result.Paper),
		AlreadyExists:  result.AlreadyExists,
		DuplicateField: result.DuplicateField,
	}
}
