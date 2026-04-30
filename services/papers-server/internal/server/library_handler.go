package server

import (
	"context"
	"net/http"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1/papersv1connect"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/library"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type LibraryUsecase interface {
	LoadGlobalConfig(context.Context, string) (model.PapersGlobalConfig, error)
	SaveGlobalConfig(context.Context, string, model.PapersGlobalConfig) error
	LoadLibraryConfig(context.Context, string) (model.PapersLibraryConfig, error)
	SaveLibraryConfig(context.Context, string, model.PapersLibraryConfig) error
	ListLibraries(context.Context, string) ([]library.LibraryInfo, string, error)
	ListDirectories(context.Context, string) (model.DirectoryNode, error)
}

type LibraryHandler struct {
	service LibraryUsecase
}

func NewLibraryHandler(service LibraryUsecase) (string, http.Handler) {
	return papersv1connect.NewLibraryServiceHandler(&LibraryHandler{service: service})
}

func (handler *LibraryHandler) LoadGlobalConfig(
	ctx context.Context,
	request *connect.Request[papersv1.LoadGlobalConfigRequest],
) (*connect.Response[papersv1.PapersGlobalConfig], error) {
	config, err := handler.service.LoadGlobalConfig(ctx, request.Msg.UserDataDir)
	if err != nil {
		return nil, internalError(err)
	}
	return connect.NewResponse(toProtoGlobalConfig(config)), nil
}

func (handler *LibraryHandler) SaveGlobalConfig(
	ctx context.Context,
	request *connect.Request[papersv1.SaveGlobalConfigRequest],
) (*connect.Response[papersv1.SaveGlobalConfigResponse], error) {
	if err := handler.service.SaveGlobalConfig(ctx, request.Msg.UserDataDir, fromProtoGlobalConfig(request.Msg.Config)); err != nil {
		return nil, internalError(err)
	}
	return connect.NewResponse(&papersv1.SaveGlobalConfigResponse{}), nil
}

func (handler *LibraryHandler) LoadLibraryConfig(
	ctx context.Context,
	request *connect.Request[papersv1.LoadLibraryConfigRequest],
) (*connect.Response[papersv1.PapersLibraryConfig], error) {
	config, err := handler.service.LoadLibraryConfig(ctx, request.Msg.LibraryRoot)
	if err != nil {
		return nil, invalidArgumentError(err)
	}
	return connect.NewResponse(toProtoLibraryConfig(config)), nil
}

func (handler *LibraryHandler) SaveLibraryConfig(
	ctx context.Context,
	request *connect.Request[papersv1.SaveLibraryConfigRequest],
) (*connect.Response[papersv1.SaveLibraryConfigResponse], error) {
	if err := handler.service.SaveLibraryConfig(ctx, request.Msg.LibraryRoot, fromProtoLibraryConfig(request.Msg.Config)); err != nil {
		return nil, invalidArgumentError(err)
	}
	return connect.NewResponse(&papersv1.SaveLibraryConfigResponse{}), nil
}

func (handler *LibraryHandler) ListLibraries(
	ctx context.Context,
	request *connect.Request[papersv1.ListLibrariesRequest],
) (*connect.Response[papersv1.ListLibrariesResponse], error) {
	libraries, activeRoot, err := handler.service.ListLibraries(ctx, request.Msg.UserDataDir)
	if err != nil {
		return nil, internalError(err)
	}
	response := &papersv1.ListLibrariesResponse{ActiveLibraryRoot: activeRoot}
	for _, item := range libraries {
		response.Libraries = append(response.Libraries, &papersv1.LibraryInfo{
			RootPath: item.RootPath,
			Name:     item.Name,
			IsActive: item.IsActive,
		})
	}
	return connect.NewResponse(response), nil
}

func (handler *LibraryHandler) ListDirectories(
	ctx context.Context,
	request *connect.Request[papersv1.ListDirectoriesRequest],
) (*connect.Response[papersv1.ListDirectoriesResponse], error) {
	root, err := handler.service.ListDirectories(ctx, request.Msg.LibraryRoot)
	if err != nil {
		return nil, invalidArgumentError(err)
	}
	return connect.NewResponse(&papersv1.ListDirectoriesResponse{Root: toProtoDirectoryNode(root)}), nil
}
