package server

import (
	"context"
	"errors"
	"testing"

	"connectrpc.com/connect"
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/library"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type fakeLibraryUsecase struct {
	globalConfig model.PapersGlobalConfig
	libraries    []library.LibraryInfo
	activeRoot   string
	directories  model.DirectoryNode
	err          error
}

func (usecase fakeLibraryUsecase) LoadGlobalConfig(context.Context, string) (model.PapersGlobalConfig, error) {
	return usecase.globalConfig, usecase.err
}

func (usecase fakeLibraryUsecase) SaveGlobalConfig(context.Context, string, model.PapersGlobalConfig) error {
	return usecase.err
}

func (usecase fakeLibraryUsecase) LoadLibraryConfig(context.Context, string) (model.PapersLibraryConfig, error) {
	return model.DefaultPapersLibraryConfig(), usecase.err
}

func (usecase fakeLibraryUsecase) SaveLibraryConfig(context.Context, string, model.PapersLibraryConfig) error {
	return usecase.err
}

func (usecase fakeLibraryUsecase) ListLibraries(context.Context, string) ([]library.LibraryInfo, string, error) {
	return usecase.libraries, usecase.activeRoot, usecase.err
}

func (usecase fakeLibraryUsecase) ListDirectories(context.Context, string) (model.DirectoryNode, error) {
	return usecase.directories, usecase.err
}

func TestLibraryHandlerListDirectories(t *testing.T) {
	testcases := []struct {
		name     string
		usecase  fakeLibraryUsecase
		wantCode connect.Code
	}{
		{
			name: "maps directory tree",
			usecase: fakeLibraryUsecase{
				directories: model.DirectoryNode{
					Name:         "library",
					RelativePath: "",
					Children:     []model.DirectoryNode{{Name: "papers", RelativePath: "papers"}},
				},
			},
		},
		{
			name:     "maps usecase error",
			usecase:  fakeLibraryUsecase{err: errors.New("invalid root")},
			wantCode: connect.CodeInvalidArgument,
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &LibraryHandler{service: testcase.usecase}
			response, err := handler.ListDirectories(
				context.Background(),
				connect.NewRequest(&papersv1.ListDirectoriesRequest{LibraryRoot: "C:/papers"}),
			)
			if testcase.wantCode != 0 {
				if connect.CodeOf(err) != testcase.wantCode {
					t.Fatalf("error code = %v, want %v; err = %v", connect.CodeOf(err), testcase.wantCode, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("ListDirectories() error = %v", err)
			}
			if response.Msg.Root.Name != "library" || response.Msg.Root.Children[0].RelativePath != "papers" {
				t.Fatalf("ListDirectories() = %+v", response.Msg.Root)
			}
		})
	}
}

func TestLibraryHandlerListLibraries(t *testing.T) {
	testcases := []struct {
		name    string
		usecase fakeLibraryUsecase
	}{
		{
			name: "maps libraries",
			usecase: fakeLibraryUsecase{
				activeRoot: "D:/papers",
				libraries: []library.LibraryInfo{
					{RootPath: "C:/papers", Name: "papers", IsActive: false},
					{RootPath: "D:/papers", Name: "papers", IsActive: true},
				},
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			handler := &LibraryHandler{service: testcase.usecase}
			response, err := handler.ListLibraries(
				context.Background(),
				connect.NewRequest(&papersv1.ListLibrariesRequest{UserDataDir: "user-data"}),
			)
			if err != nil {
				t.Fatalf("ListLibraries() error = %v", err)
			}
			if response.Msg.ActiveLibraryRoot != testcase.usecase.activeRoot || len(response.Msg.Libraries) != 2 {
				t.Fatalf("ListLibraries() = %+v", response.Msg)
			}
		})
	}
}
