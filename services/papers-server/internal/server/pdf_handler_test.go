package server

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
)

type fakePDFUsecase struct {
	bytes []byte
	err   error
}

func (usecase fakePDFUsecase) LoadPDFBytes(context.Context, string, string) ([]byte, error) {
	return usecase.bytes, usecase.err
}

func TestPDFHandlerLoadPDFBytes(t *testing.T) {
	testcases := []struct {
		name     string
		usecase  fakePDFUsecase
		wantCode connect.Code
	}{
		{
			name:    "maps bytes",
			usecase: fakePDFUsecase{bytes: []byte("pdf")},
		},
		{
			name:     "maps error",
			usecase:  fakePDFUsecase{err: errors.New("missing pdf")},
			wantCode: connect.CodeInvalidArgument,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &PDFHandler{service: testcase.usecase}
			response, err := handler.LoadPdfBytes(
				context.Background(),
				connect.NewRequest(&papersv1.LoadPdfBytesRequest{LibraryRoot: "C:/papers", PdfPath: "papers/a.pdf"}),
			)
			if testcase.wantCode != 0 {
				if connect.CodeOf(err) != testcase.wantCode {
					t.Fatalf("error code = %v, want %v; err = %v", connect.CodeOf(err), testcase.wantCode, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("LoadPdfBytes() error = %v", err)
			}
			if string(response.Msg.Bytes) != "pdf" {
				t.Fatalf("bytes = %q, want pdf", string(response.Msg.Bytes))
			}
		})
	}
}
