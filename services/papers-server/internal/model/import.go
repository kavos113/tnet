package model

type BrowserImportStatus string

const (
	BrowserImportStatusCreated      BrowserImportStatus = "created"
	BrowserImportStatusDuplicate    BrowserImportStatus = "duplicate"
	BrowserImportStatusMetadataOnly BrowserImportStatus = "metadata_only"
)

type BrowserImportCandidate struct {
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	PDFURL        string
}
