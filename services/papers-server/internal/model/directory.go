package model

type DirectoryNode struct {
	Name         string
	RelativePath string
	Children     []DirectoryNode
}
