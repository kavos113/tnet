package model

type PapersGlobalConfig struct {
	LibraryRoots        []string `json:"libraryRoots"`
	ActiveLibraryRoot   string   `json:"activeLibraryRoot,omitempty"`
	LastOpenedDirectory string   `json:"lastOpenedDirectory,omitempty"`
}

type GlobalConfig struct {
	ActiveAppID string                 `json:"activeAppId,omitempty"`
	Apps        map[string]interface{} `json:"apps,omitempty"`
}

type PapersLibraryConfig struct {
	ListDensity    string `json:"listDensity"`
	PDFZoomMode    string `json:"pdfZoomMode"`
	NoteEditorMode string `json:"noteEditorMode"`
}

func DefaultPapersGlobalConfig() PapersGlobalConfig {
	return PapersGlobalConfig{LibraryRoots: []string{}}
}

func DefaultPapersLibraryConfig() PapersLibraryConfig {
	return PapersLibraryConfig{
		ListDensity:    "comfortable",
		PDFZoomMode:    "page-width",
		NoteEditorMode: "split",
	}
}

func NormalizePapersLibraryConfig(config PapersLibraryConfig) PapersLibraryConfig {
	defaults := DefaultPapersLibraryConfig()
	if config.ListDensity == "" {
		config.ListDensity = defaults.ListDensity
	}
	if config.PDFZoomMode == "" {
		config.PDFZoomMode = defaults.PDFZoomMode
	}
	if config.NoteEditorMode == "" {
		config.NoteEditorMode = defaults.NoteEditorMode
	}
	return config
}
