package server

import (
	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func toProtoPaperSummary(paper model.Paper) *papersv1.PaperSummary {
	return &papersv1.PaperSummary{
		Id:            paper.ID,
		Title:         paper.Title,
		Authors:       paper.Authors,
		PublishedYear: paper.PublishedYear,
		Venue:         paper.Venue,
		Tags:          paper.Tags,
		HasPdf:        paper.PDFPath != "",
	}
}

func toProtoPaperDetail(paper model.Paper) *papersv1.PaperDetail {
	return &papersv1.PaperDetail{
		Id:            paper.ID,
		Title:         paper.Title,
		Authors:       paper.Authors,
		PublishedYear: paper.PublishedYear,
		Venue:         paper.Venue,
		Tags:          paper.Tags,
		HasPdf:        paper.PDFPath != "",
		Abstract:      paper.Abstract,
		Doi:           paper.DOI,
		ArxivId:       paper.ArxivID,
		Url:           paper.URL,
		PdfPath:       paper.PDFPath,
		DirectoryPath: paper.DirectoryPath,
		NoteContent:   paper.NoteContent,
	}
}

func toProtoImportPaperResponse(result paper.ImportResult) *papersv1.ImportPaperResponse {
	return &papersv1.ImportPaperResponse{
		Paper:          toProtoPaperDetail(result.Paper),
		AlreadyExists:  result.AlreadyExists,
		DuplicateField: result.DuplicateField,
	}
}

func toProtoPaperTag(tag model.PaperTag) *papersv1.PaperTag {
	return &papersv1.PaperTag{
		Id:    tag.ID,
		Name:  tag.Name,
		Color: tag.Color,
	}
}
