package config

import (
	"context"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type JSONRepository struct{}

func NewJSONRepository() *JSONRepository {
	return &JSONRepository{}
}

func (repository *JSONRepository) LoadPapersGlobalConfig(
	ctx context.Context,
	userDataDir string,
) (model.PapersGlobalConfig, error) {
	if userDataDir == "" {
		return model.DefaultPapersGlobalConfig(), nil
	}
	globalConfig := model.GlobalConfig{
		ActiveAppID: "markdown",
		Apps: map[string]interface{}{
			"markdown": map[string]interface{}{},
			"papers":   map[string]interface{}{},
			"code":     map[string]interface{}{},
		},
	}
	if err := readJSON(ctx, globalConfigPath(userDataDir), &globalConfig); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return model.PapersGlobalConfig{}, err
		}
	}

	papersConfig := model.DefaultPapersGlobalConfig()
	if raw, ok := globalConfig.Apps["papers"]; ok {
		bytes, err := json.Marshal(raw)
		if err != nil {
			return model.PapersGlobalConfig{}, err
		}
		if err := json.Unmarshal(bytes, &papersConfig); err != nil {
			return model.PapersGlobalConfig{}, err
		}
	}
	if papersConfig.LibraryRoots == nil {
		papersConfig.LibraryRoots = []string{}
	}

	return papersConfig, nil
}

func (repository *JSONRepository) SavePapersGlobalConfig(
	ctx context.Context,
	userDataDir string,
	config model.PapersGlobalConfig,
) error {
	if userDataDir == "" {
		return errors.New("user data dir is required")
	}
	globalConfig := model.GlobalConfig{
		ActiveAppID: "markdown",
		Apps: map[string]interface{}{
			"markdown": map[string]interface{}{},
			"papers":   map[string]interface{}{},
			"code":     map[string]interface{}{},
		},
	}
	if err := readJSON(ctx, globalConfigPath(userDataDir), &globalConfig); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	if globalConfig.Apps == nil {
		globalConfig.Apps = map[string]interface{}{}
	}
	globalConfig.Apps["papers"] = config

	return writeJSON(ctx, globalConfigPath(userDataDir), globalConfig)
}

func (repository *JSONRepository) LoadPapersLibraryConfig(
	ctx context.Context,
	libraryRoot model.LibraryRoot,
) (model.PapersLibraryConfig, error) {
	config := model.DefaultPapersLibraryConfig()
	if err := readJSON(ctx, papersSettingsPath(libraryRoot), &config); err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			return model.PapersLibraryConfig{}, err
		}
	}
	return model.NormalizePapersLibraryConfig(config), nil
}

func (repository *JSONRepository) SavePapersLibraryConfig(
	ctx context.Context,
	libraryRoot model.LibraryRoot,
	config model.PapersLibraryConfig,
) error {
	return writeJSON(ctx, papersSettingsPath(libraryRoot), model.NormalizePapersLibraryConfig(config))
}

func globalConfigPath(userDataDir string) string {
	return filepath.Join(userDataDir, "config.json")
}

func papersSettingsPath(libraryRoot model.LibraryRoot) string {
	return filepath.Join(libraryRoot.String(), ".tnet", "papers", "settings.json")
}

func readJSON(ctx context.Context, filePath string, out interface{}) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(bytes, out)
}

func writeJSON(ctx context.Context, filePath string, value interface{}) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	if err := os.MkdirAll(filepath.Dir(filePath), 0o755); err != nil {
		return err
	}
	bytes, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return err
	}
	bytes = append(bytes, '\n')
	return os.WriteFile(filePath, bytes, 0o644)
}
