package model

type BrowserImportStatus string

const (
	BrowserImportStatusCreated      BrowserImportStatus = "created"
	BrowserImportStatusDuplicate    BrowserImportStatus = "duplicate"
	BrowserImportStatusMetadataOnly BrowserImportStatus = "metadata_only"
)

type BrowserImportCandidate struct {
	URL           string
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	PDFURL        string
}
