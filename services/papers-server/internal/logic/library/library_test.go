package library_test

import (
	"context"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/logic/library"
	mocklibrary "github.com/kavos113/tnet/services/papers-server/internal/logic/library/mock"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
	"go.uber.org/mock/gomock"
)

func TestServiceListLibrariesUsesConfigRepository(t *testing.T) {
	testcases := []struct {
		name       string
		userData   string
		serviceDir string
		config     model.PapersGlobalConfig
	}{
		{
			name:       "uses explicit user data dir and marks active library",
			userData:   "explicit",
			serviceDir: "fallback",
			config: model.PapersGlobalConfig{
				LibraryRoots:      []string{"C:/papers", "D:/archive"},
				ActiveLibraryRoot: "D:/archive",
			},
		},
		{
			name:       "uses fallback user data dir",
			serviceDir: "fallback",
			config:     model.PapersGlobalConfig{LibraryRoots: []string{"C:/papers"}},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			wantUserData := testcase.userData
			if wantUserData == "" {
				wantUserData = testcase.serviceDir
			}

			ctrl := gomock.NewController(t)
			configRepository := mocklibrary.NewMockConfigRepository(ctrl)
			directoryRepository := mocklibrary.NewMockDirectoryRepository(ctrl)
			configRepository.EXPECT().LoadPapersGlobalConfig(ctx, wantUserData).Return(testcase.config, nil)

			service := library.NewService(configRepository, directoryRepository, testcase.serviceDir)
			libraries, activeRoot, err := service.ListLibraries(ctx, testcase.userData)
			if err != nil {
				t.Fatalf("ListLibraries() error = %v", err)
			}
			if activeRoot != testcase.config.ActiveLibraryRoot {
				t.Fatalf("activeRoot = %q, want %q", activeRoot, testcase.config.ActiveLibraryRoot)
			}
			if len(libraries) != len(testcase.config.LibraryRoots) {
				t.Fatalf("libraries length = %d, want %d", len(libraries), len(testcase.config.LibraryRoots))
			}
			for i, root := range testcase.config.LibraryRoots {
				if libraries[i].RootPath != root {
					t.Fatalf("libraries[%d].RootPath = %q, want %q", i, libraries[i].RootPath, root)
				}
				if libraries[i].IsActive != (root == testcase.config.ActiveLibraryRoot) {
					t.Fatalf("libraries[%d].IsActive = %v", i, libraries[i].IsActive)
				}
			}
		})
	}
}

func TestServiceListDirectoriesUsesDirectoryRepository(t *testing.T) {
	testcases := []struct {
		name string
		root string
		node model.DirectoryNode
	}{
		{
			name: "normalizes root and returns directory tree",
			root: "library",
			node: model.DirectoryNode{Name: "library", Children: []model.DirectoryNode{{Name: "papers", RelativePath: "papers"}}},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			root, err := model.NewLibraryRoot(testcase.root)
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}

			ctrl := gomock.NewController(t)
			configRepository := mocklibrary.NewMockConfigRepository(ctrl)
			directoryRepository := mocklibrary.NewMockDirectoryRepository(ctrl)
			directoryRepository.EXPECT().ListDirectories(ctx, root).Return(testcase.node, nil)

			service := library.NewService(configRepository, directoryRepository, "")
			got, err := service.ListDirectories(ctx, testcase.root)
			if err != nil {
				t.Fatalf("ListDirectories() error = %v", err)
			}
			if got.Name != testcase.node.Name || len(got.Children) != len(testcase.node.Children) {
				t.Fatalf("ListDirectories() = %+v, want %+v", got, testcase.node)
			}
		})
	}
}

func TestServiceConfigMethodsUseConfigRepository(t *testing.T) {
	testcases := []struct {
		name string
		run  func(t *testing.T, ctx context.Context, service *library.Service, configRepository *mocklibrary.MockConfigRepository)
	}{
		{
			name: "loads global config",
			run: func(t *testing.T, ctx context.Context, service *library.Service, configRepository *mocklibrary.MockConfigRepository) {
				t.Helper()
				want := model.PapersGlobalConfig{LibraryRoots: []string{"C:/papers"}}
				configRepository.EXPECT().LoadPapersGlobalConfig(ctx, "fallback").Return(want, nil)
				got, err := service.LoadGlobalConfig(ctx, "")
				if err != nil || len(got.LibraryRoots) != 1 {
					t.Fatalf("LoadGlobalConfig() = %+v, %v; want config", got, err)
				}
			},
		},
		{
			name: "saves library config with normalized root",
			run: func(t *testing.T, ctx context.Context, service *library.Service, configRepository *mocklibrary.MockConfigRepository) {
				t.Helper()
				root, err := model.NewLibraryRoot("library")
				if err != nil {
					t.Fatalf("NewLibraryRoot() error = %v", err)
				}
				config := model.DefaultPapersLibraryConfig()
				configRepository.EXPECT().SavePapersLibraryConfig(ctx, root, config).Return(nil)
				if err := service.SaveLibraryConfig(ctx, "library", config); err != nil {
					t.Fatalf("SaveLibraryConfig() error = %v", err)
				}
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			ctx := context.Background()
			ctrl := gomock.NewController(t)
			configRepository := mocklibrary.NewMockConfigRepository(ctrl)
			directoryRepository := mocklibrary.NewMockDirectoryRepository(ctrl)
			service := library.NewService(configRepository, directoryRepository, "fallback")
			testcase.run(t, ctx, service, configRepository)
		})
	}
}
