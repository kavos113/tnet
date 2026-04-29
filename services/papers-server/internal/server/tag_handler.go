package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type TagUsecase interface {
	ListTags(context.Context, string) ([]model.PaperTag, error)
	UpsertTag(context.Context, string, string, string) (model.PaperTag, error)
	AttachTag(context.Context, string, string, string) (model.Paper, bool, error)
	DetachTag(context.Context, string, string, string) (model.Paper, bool, error)
}

type TagHandler struct {
	service TagUsecase
}

func NewTagHandler(service TagUsecase) (string, http.Handler) {
	return papersv1connect.NewTagServiceHandler(&TagHandler{service: service})
}

func (handler *TagHandler) ListTags(
	ctx context.Context,
	request *connect.Request[papersv1.ListTagsRequest],
) (*connect.Response[papersv1.ListTagsResponse], error) {
	tags, err := handler.service.ListTags(ctx, request.Msg.LibraryRoot)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	response := &papersv1.ListTagsResponse{}
	for _, tag := range tags {
		response.Tags = append(response.Tags, toProtoPaperTag(tag))
	}
	return connect.NewResponse(response), nil
}

func (handler *TagHandler) UpsertTag(
	ctx context.Context,
	request *connect.Request[papersv1.UpsertTagRequest],
) (*connect.Response[papersv1.PaperTag], error) {
	tag, err := handler.service.UpsertTag(ctx, request.Msg.LibraryRoot, request.Msg.Name, request.Msg.Color)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	return connect.NewResponse(toProtoPaperTag(tag)), nil
}

func (handler *TagHandler) AttachTag(
	ctx context.Context,
	request *connect.Request[papersv1.AttachTagRequest],
) (*connect.Response[papersv1.GetPaperResponse], error) {
	paper, ok, err := handler.service.AttachTag(ctx, request.Msg.LibraryRoot, request.Msg.PaperId, request.Msg.TagId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if !ok {
		return connect.NewResponse(&papersv1.GetPaperResponse{}), nil
	}
	return connect.NewResponse(&papersv1.GetPaperResponse{Paper: toProtoPaperDetail(paper)}), nil
}

func (handler *TagHandler) DetachTag(
	ctx context.Context,
	request *connect.Request[papersv1.DetachTagRequest],
) (*connect.Response[papersv1.GetPaperResponse], error) {
	paper, ok, err := handler.service.DetachTag(ctx, request.Msg.LibraryRoot, request.Msg.PaperId, request.Msg.TagId)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	if !ok {
		return connect.NewResponse(&papersv1.GetPaperResponse{}), nil
	}
	return connect.NewResponse(&papersv1.GetPaperResponse{Paper: toProtoPaperDetail(paper)}), nil
}

func toProtoPaperTag(tag model.PaperTag) *papersv1.PaperTag {
	return &papersv1.PaperTag{
		Id:    tag.ID,
		Name:  tag.Name,
		Color: tag.Color,
	}
}
