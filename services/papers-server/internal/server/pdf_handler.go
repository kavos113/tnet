package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
)

type PDFUsecase interface {
	LoadPDFBytes(context.Context, string, string) ([]byte, error)
}

type PDFHandler struct {
	service PDFUsecase
}

func NewPDFHandler(service PDFUsecase) (string, http.Handler) {
	return papersv1connect.NewPdfServiceHandler(&PDFHandler{service: service})
}

func (handler *PDFHandler) LoadPdfBytes(
	ctx context.Context,
	request *connect.Request[papersv1.LoadPdfBytesRequest],
) (*connect.Response[papersv1.LoadPdfBytesResponse], error) {
	bytes, err := handler.service.LoadPDFBytes(ctx, request.Msg.LibraryRoot, request.Msg.PdfPath)
	if err != nil {
		return nil, invalidArgumentError(err)
	}
	return connect.NewResponse(&papersv1.LoadPdfBytesResponse{Bytes: bytes}), nil
}
