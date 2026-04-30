package server

import (
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func toProtoGlobalConfig(config model.PapersGlobalConfig) *papersv1.PapersGlobalConfig {
	return &papersv1.PapersGlobalConfig{
		LibraryRoots:        config.LibraryRoots,
		ActiveLibraryRoot:   config.ActiveLibraryRoot,
		LastOpenedDirectory: config.LastOpenedDirectory,
	}
}

func fromProtoGlobalConfig(config *papersv1.PapersGlobalConfig) model.PapersGlobalConfig {
	if config == nil {
		return model.DefaultPapersGlobalConfig()
	}
	return model.PapersGlobalConfig{
		LibraryRoots:        config.LibraryRoots,
		ActiveLibraryRoot:   config.ActiveLibraryRoot,
		LastOpenedDirectory: config.LastOpenedDirectory,
	}
}

func toProtoLibraryConfig(config model.PapersLibraryConfig) *papersv1.PapersLibraryConfig {
	return &papersv1.PapersLibraryConfig{
		ListDensity:            config.ListDensity,
		PdfZoomMode:            config.PDFZoomMode,
		NoteEditorMode:         config.NoteEditorMode,
		NoteAutoSaveDebounceMs: config.NoteAutoSaveDebounceMs,
	}
}

func fromProtoLibraryConfig(config *papersv1.PapersLibraryConfig) model.PapersLibraryConfig {
	if config == nil {
		return model.DefaultPapersLibraryConfig()
	}
	return model.PapersLibraryConfig{
		ListDensity:            config.ListDensity,
		PDFZoomMode:            config.PdfZoomMode,
		NoteEditorMode:         config.NoteEditorMode,
		NoteAutoSaveDebounceMs: config.NoteAutoSaveDebounceMs,
	}
}

func toProtoDirectoryNode(node model.DirectoryNode) *papersv1.DirectoryNode {
	protoNode := &papersv1.DirectoryNode{
		Name:         node.Name,
		RelativePath: node.RelativePath,
	}
	for _, child := range node.Children {
		protoNode.Children = append(protoNode.Children, toProtoDirectoryNode(child))
	}
	return protoNode
}
