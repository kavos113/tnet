package server

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type fakeTagUsecase struct {
	tags  []model.PaperTag
	tag   model.PaperTag
	paper model.Paper
	ok    bool
	err   error
}

func (usecase fakeTagUsecase) ListTags(context.Context, string) ([]model.PaperTag, error) {
	return usecase.tags, usecase.err
}

func (usecase fakeTagUsecase) UpsertTag(context.Context, string, string, string) (model.PaperTag, error) {
	return usecase.tag, usecase.err
}

func (usecase fakeTagUsecase) AttachTag(context.Context, string, string, string) (model.Paper, bool, error) {
	return usecase.paper, usecase.ok, usecase.err
}

func (usecase fakeTagUsecase) DetachTag(context.Context, string, string, string) (model.Paper, bool, error) {
	return usecase.paper, usecase.ok, usecase.err
}

func TestTagHandlerListTags(t *testing.T) {
	testcases := []struct {
		name     string
		usecase  fakeTagUsecase
		wantCode connect.Code
	}{
		{
			name: "maps tags",
			usecase: fakeTagUsecase{
				tags: []model.PaperTag{{ID: "tag-1", Name: "ai", Color: "#111111"}},
			},
		},
		{
			name:     "maps error",
			usecase:  fakeTagUsecase{err: errors.New("invalid")},
			wantCode: connect.CodeInvalidArgument,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &TagHandler{service: testcase.usecase}
			response, err := handler.ListTags(
				context.Background(),
				connect.NewRequest(&papersv1.ListTagsRequest{LibraryRoot: "C:/papers"}),
			)
			if testcase.wantCode != 0 {
				if connect.CodeOf(err) != testcase.wantCode {
					t.Fatalf("error code = %v, want %v; err = %v", connect.CodeOf(err), testcase.wantCode, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("ListTags() error = %v", err)
			}
			if len(response.Msg.Tags) != 1 || response.Msg.Tags[0].Name != "ai" {
				t.Fatalf("ListTags() = %+v", response.Msg)
			}
		})
	}
}

func TestTagHandlerAttachTag(t *testing.T) {
	testcases := []struct {
		name      string
		usecase   fakeTagUsecase
		wantPaper bool
	}{
		{
			name:      "maps updated paper",
			usecase:   fakeTagUsecase{paper: model.Paper{ID: "paper-1", Title: "Paper"}, ok: true},
			wantPaper: true,
		},
		{
			name:    "returns empty response when paper is missing",
			usecase: fakeTagUsecase{ok: false},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &TagHandler{service: testcase.usecase}
			response, err := handler.AttachTag(
				context.Background(),
				connect.NewRequest(&papersv1.AttachTagRequest{LibraryRoot: "C:/papers", PaperId: "paper-1", TagId: "tag-1"}),
			)
			if err != nil {
				t.Fatalf("AttachTag() error = %v", err)
			}
			gotPaper := response.Msg.Paper != nil
			if gotPaper != testcase.wantPaper {
				t.Fatalf("response has paper = %v, want %v", gotPaper, testcase.wantPaper)
			}
		})
	}
}

func TestTagHandlerUpsertAndDetachTag(t *testing.T) {
	testcases := []struct {
		name      string
		run       func(t *testing.T, handler *TagHandler)
		usecase   fakeTagUsecase
		wantCode  connect.Code
		wantPaper bool
	}{
		{
			name:    "upserts tag",
			usecase: fakeTagUsecase{tag: model.PaperTag{ID: "tag-1", Name: "ai", Color: "#111111"}},
			run: func(t *testing.T, handler *TagHandler) {
				t.Helper()
				response, err := handler.UpsertTag(
					context.Background(),
					connect.NewRequest(&papersv1.UpsertTagRequest{LibraryRoot: "C:/papers", Name: "ai", Color: "#111111"}),
				)
				if err != nil {
					t.Fatalf("UpsertTag() error = %v", err)
				}
				if response.Msg.Id != "tag-1" || response.Msg.Name != "ai" {
					t.Fatalf("UpsertTag() = %+v", response.Msg)
				}
			},
		},
		{
			name:      "detaches tag and returns paper",
			usecase:   fakeTagUsecase{paper: model.Paper{ID: "paper-1", Title: "Paper"}, ok: true},
			wantPaper: true,
			run: func(t *testing.T, handler *TagHandler) {
				t.Helper()
				response, err := handler.DetachTag(
					context.Background(),
					connect.NewRequest(&papersv1.DetachTagRequest{LibraryRoot: "C:/papers", PaperId: "paper-1", TagId: "tag-1"}),
				)
				if err != nil {
					t.Fatalf("DetachTag() error = %v", err)
				}
				if (response.Msg.Paper != nil) != true {
					t.Fatalf("DetachTag() = %+v", response.Msg)
				}
			},
		},
		{
			name:    "detach returns empty response when paper is missing",
			usecase: fakeTagUsecase{ok: false},
			run: func(t *testing.T, handler *TagHandler) {
				t.Helper()
				response, err := handler.DetachTag(
					context.Background(),
					connect.NewRequest(&papersv1.DetachTagRequest{LibraryRoot: "C:/papers", PaperId: "missing", TagId: "tag-1"}),
				)
				if err != nil {
					t.Fatalf("DetachTag() error = %v", err)
				}
				if response.Msg.Paper != nil {
					t.Fatalf("DetachTag() = %+v", response.Msg)
				}
			},
		},
		{
			name:     "detach maps errors",
			usecase:  fakeTagUsecase{err: errors.New("invalid")},
			wantCode: connect.CodeInvalidArgument,
			run: func(t *testing.T, handler *TagHandler) {
				t.Helper()
				_, err := handler.DetachTag(
					context.Background(),
					connect.NewRequest(&papersv1.DetachTagRequest{LibraryRoot: "C:/papers", PaperId: "paper-1", TagId: "tag-1"}),
				)
				if connect.CodeOf(err) != connect.CodeInvalidArgument {
					t.Fatalf("error code = %v, want %v; err = %v", connect.CodeOf(err), connect.CodeInvalidArgument, err)
				}
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &TagHandler{service: testcase.usecase}
			testcase.run(t, handler)
		})
	}
}
