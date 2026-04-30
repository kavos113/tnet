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
	ListDensity            string `json:"listDensity"`
	PDFZoomMode            string `json:"pdfZoomMode"`
	NoteEditorMode         string `json:"noteEditorMode"`
	NoteAutoSaveDebounceMs int32  `json:"noteAutoSaveDebounceMs"`
}

func DefaultPapersGlobalConfig() PapersGlobalConfig {
	return PapersGlobalConfig{LibraryRoots: []string{}}
}

func DefaultPapersLibraryConfig() PapersLibraryConfig {
	return PapersLibraryConfig{
		ListDensity:            "comfortable",
		PDFZoomMode:            "page-width",
		NoteEditorMode:         "split",
		NoteAutoSaveDebounceMs: 500,
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
	if config.NoteAutoSaveDebounceMs <= 0 {
		config.NoteAutoSaveDebounceMs = defaults.NoteAutoSaveDebounceMs
	}
	return config
}
