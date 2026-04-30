package filesystem

import (
	"context"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type DirectoryRepository struct{}

func NewDirectoryRepository() *DirectoryRepository {
	return &DirectoryRepository{}
}

func (repository *DirectoryRepository) ListDirectories(
	ctx context.Context,
	libraryRoot model.LibraryRoot,
) (model.DirectoryNode, error) {
	root := model.DirectoryNode{Name: filepath.Base(libraryRoot.String()), RelativePath: ""}
	children, err := listChildren(ctx, libraryRoot.String(), "")
	if err != nil {
		if os.IsNotExist(err) {
			return root, nil
		}
		return model.DirectoryNode{}, err
	}
	root.Children = children
	return root, nil
}

func listChildren(ctx context.Context, root string, relativePath string) ([]model.DirectoryNode, error) {
	select {
	case <-ctx.Done():
		return nil, ctx.Err()
	default:
	}
	absolutePath := filepath.Join(root, filepath.FromSlash(relativePath))
	entries, err := os.ReadDir(absolutePath)
	if err != nil {
		return nil, err
	}

	nodes := make([]model.DirectoryNode, 0)
	for _, entry := range entries {
		if !entry.IsDir() || strings.HasPrefix(entry.Name(), ".") {
			continue
		}
		childRelativePath := entry.Name()
		if relativePath != "" {
			childRelativePath = relativePath + "/" + entry.Name()
		}
		children, err := listChildren(ctx, root, childRelativePath)
		if err != nil {
			return nil, err
		}
		nodes = append(nodes, model.DirectoryNode{
			Name:         entry.Name(),
			RelativePath: childRelativePath,
			Children:     children,
		})
	}

	sort.Slice(nodes, func(i, j int) bool {
		return strings.ToLower(nodes[i].Name) < strings.ToLower(nodes[j].Name)
	})
	return nodes, nil
}
