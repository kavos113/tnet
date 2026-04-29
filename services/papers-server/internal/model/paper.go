package model

type Paper struct {
	ID            string
	Title         string
	Authors       []string
	Abstract      string
	PublishedYear int
	Venue         string
	DOI           string
	ArxivID       string
	URL           string
	PDFPath       RelativePath
	DirectoryPath RelativePath
}
