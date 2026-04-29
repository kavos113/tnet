package library

import (
	"context"
	"path/filepath"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
	"github.com/kavos113/tnet/services/papers-server/internal/repository/filesystem"
)

type ConfigRepository interface {
	LoadPapersGlobalConfig(context.Context, string) (model.PapersGlobalConfig, error)
	SavePapersGlobalConfig(context.Context, string, model.PapersGlobalConfig) error
	LoadPapersLibraryConfig(context.Context, model.LibraryRoot) (model.PapersLibraryConfig, error)
	SavePapersLibraryConfig(context.Context, model.LibraryRoot, model.PapersLibraryConfig) error
}

type DirectoryRepository interface {
	ListDirectories(context.Context, model.LibraryRoot) (filesystem.DirectoryNode, error)
}

type LibraryInfo struct {
	RootPath string
	Name     string
	IsActive bool
}

type Service struct {
	configRepository    ConfigRepository
	directoryRepository DirectoryRepository
	userDataDir         string
}

func NewService(
	configRepository ConfigRepository,
	directoryRepository DirectoryRepository,
	userDataDir string,
) *Service {
	return &Service{
		configRepository:    configRepository,
		directoryRepository: directoryRepository,
		userDataDir:         userDataDir,
	}
}

func (service *Service) LoadGlobalConfig(
	ctx context.Context,
	userDataDir string,
) (model.PapersGlobalConfig, error) {
	return service.configRepository.LoadPapersGlobalConfig(ctx, service.resolveUserDataDir(userDataDir))
}

func (service *Service) SaveGlobalConfig(
	ctx context.Context,
	userDataDir string,
	config model.PapersGlobalConfig,
) error {
	return service.configRepository.SavePapersGlobalConfig(ctx, service.resolveUserDataDir(userDataDir), config)
}

func (service *Service) LoadLibraryConfig(
	ctx context.Context,
	libraryRoot string,
) (model.PapersLibraryConfig, error) {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return model.PapersLibraryConfig{}, err
	}
	return service.configRepository.LoadPapersLibraryConfig(ctx, root)
}

func (service *Service) SaveLibraryConfig(
	ctx context.Context,
	libraryRoot string,
	config model.PapersLibraryConfig,
) error {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return err
	}
	return service.configRepository.SavePapersLibraryConfig(ctx, root, config)
}

func (service *Service) ListLibraries(
	ctx context.Context,
	userDataDir string,
) ([]LibraryInfo, string, error) {
	config, err := service.configRepository.LoadPapersGlobalConfig(ctx, service.resolveUserDataDir(userDataDir))
	if err != nil {
		return nil, "", err
	}

	libraries := make([]LibraryInfo, 0, len(config.LibraryRoots))
	for _, root := range config.LibraryRoots {
		libraries = append(libraries, LibraryInfo{
			RootPath: root,
			Name:     filepath.Base(root),
			IsActive: root == config.ActiveLibraryRoot,
		})
	}

	return libraries, config.ActiveLibraryRoot, nil
}

func (service *Service) resolveUserDataDir(userDataDir string) string {
	if userDataDir != "" {
		return userDataDir
	}
	return service.userDataDir
}

func (service *Service) ListDirectories(
	ctx context.Context,
	libraryRoot string,
) (filesystem.DirectoryNode, error) {
	root, err := model.NewLibraryRoot(libraryRoot)
	if err != nil {
		return filesystem.DirectoryNode{}, err
	}
	return service.directoryRepository.ListDirectories(ctx, root)
}
