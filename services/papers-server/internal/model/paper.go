package model

type Paper struct {
	ID            string
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int32
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	PDFPath       string
	DirectoryPath string
	Tags          []string
	NoteContent   string
}
