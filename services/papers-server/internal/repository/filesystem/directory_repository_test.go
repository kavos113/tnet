package filesystem

import (
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func TestDirectoryRepositoryListDirectories(t *testing.T) {
	testcases := []struct {
		name  string
		setup func(t *testing.T, root string)
		want  []string
	}{
		{
			name: "returns sorted visible directory tree",
			setup: func(t *testing.T, root string) {
				t.Helper()
				mkdir(t, root, "zeta")
				mkdir(t, root, "Alpha")
				mkdir(t, root, "Alpha", "child")
				mkdir(t, root, ".hidden")
				writeFile(t, filepath.Join(root, "paper.pdf"), "pdf")
			},
			want: []string{"Alpha", "Alpha/child", "zeta"},
		},
		{
			name: "empty root has no children",
			want: []string{},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			rootPath := t.TempDir()
			if testcase.setup != nil {
				testcase.setup(t, rootPath)
			}
			root, err := model.NewLibraryRoot(rootPath)
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}
			got, err := NewDirectoryRepository().ListDirectories(context.Background(), root)
			if err != nil {
				t.Fatalf("ListDirectories() error = %v", err)
			}
			if got.Name != filepath.Base(rootPath) || got.RelativePath != "" {
				t.Fatalf("root = %+v, want name %q and empty relative path", got, filepath.Base(rootPath))
			}
			gotPaths := flattenDirectoryPaths(got.Children)
			assertStringSlice(t, gotPaths, testcase.want)
		})
	}
}

func TestDirectoryRepositoryListDirectoriesContextCanceled(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "returns context error"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			root, err := model.NewLibraryRoot(t.TempDir())
			if err != nil {
				t.Fatalf("NewLibraryRoot() error = %v", err)
			}
			ctx, cancel := context.WithCancel(context.Background())
			cancel()
			_, err = NewDirectoryRepository().ListDirectories(ctx, root)
			if err == nil {
				t.Fatal("ListDirectories() error = nil, want error")
			}
		})
	}
}

func mkdir(t *testing.T, root string, parts ...string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Join(append([]string{root}, parts...)...), 0o755); err != nil {
		t.Fatalf("MkdirAll() error = %v", err)
	}
}

func writeFile(t *testing.T, filePath string, content string) {
	t.Helper()
	if err := os.WriteFile(filePath, []byte(content), 0o644); err != nil {
		t.Fatalf("WriteFile() error = %v", err)
	}
}

func flattenDirectoryPaths(nodes []model.DirectoryNode) []string {
	paths := make([]string, 0)
	for _, node := range nodes {
		paths = append(paths, node.RelativePath)
		paths = append(paths, flattenDirectoryPaths(node.Children)...)
	}
	return paths
}

func assertStringSlice(t *testing.T, got []string, want []string) {
	t.Helper()
	if len(got) != len(want) {
		t.Fatalf("slice length = %d, want %d; got %#v", len(got), len(want), got)
	}
	for i := range want {
		if got[i] != want[i] {
			t.Fatalf("slice[%d] = %q, want %q", i, got[i], want[i])
		}
	}
}
