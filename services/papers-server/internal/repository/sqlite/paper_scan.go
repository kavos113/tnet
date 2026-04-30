package sqlite

import (
	"context"
	"database/sql"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type paperScanner interface {
	Scan(dest ...interface{}) error
}

func (repository *PaperRepository) scanPaper(ctx context.Context, scanner paperScanner) (model.Paper, error) {
	paper, err := scanPaperBase(scanner)
	if err != nil {
		return model.Paper{}, err
	}
	return repository.hydratePaper(ctx, paper)
}

func scanPaperBase(scanner paperScanner) (model.Paper, error) {
	var paper model.Paper
	var abstract, venue, doi, arxivID, url, pdfPath sql.NullString
	var publishedYear sql.NullInt64
	if err := scanner.Scan(
		&paper.ID,
		&paper.Title,
		&abstract,
		&publishedYear,
		&venue,
		&doi,
		&arxivID,
		&url,
		&pdfPath,
		&paper.DirectoryPath,
	); err != nil {
		return model.Paper{}, err
	}
	paper.Abstract = valueString(abstract)
	paper.PublishedYear = int32(publishedYear.Int64)
	paper.Venue = valueString(venue)
	paper.DOI = valueString(doi)
	paper.ArxivID = valueString(arxivID)
	paper.URL = valueString(url)
	paper.PDFPath = valueString(pdfPath)

	return paper, nil
}

func (repository *PaperRepository) hydratePaper(ctx context.Context, paper model.Paper) (model.Paper, error) {
	authors, err := repository.listAuthors(ctx, paper.ID)
	if err != nil {
		return model.Paper{}, err
	}
	paper.Authors = authors

	tags, err := repository.listTagNames(ctx, paper.ID)
	if err != nil {
		return model.Paper{}, err
	}
	paper.Tags = tags

	note, err := repository.getNote(ctx, paper.ID)
	if err != nil {
		return model.Paper{}, err
	}
	paper.NoteContent = note

	return paper, nil
}

func (repository *PaperRepository) listAuthors(ctx context.Context, paperID string) ([]string, error) {
	rows, err := repository.db.QueryContext(ctx, "SELECT name FROM paper_authors WHERE paper_id = ? ORDER BY position ASC", paperID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	authors := make([]string, 0)
	for rows.Next() {
		var author string
		if err := rows.Scan(&author); err != nil {
			return nil, err
		}
		authors = append(authors, author)
	}
	return authors, rows.Err()
}

func (repository *PaperRepository) listTagNames(ctx context.Context, paperID string) ([]string, error) {
	rows, err := repository.db.QueryContext(
		ctx,
		`SELECT tags.name
		FROM tags
		JOIN paper_tags ON paper_tags.tag_id = tags.id
		WHERE paper_tags.paper_id = ?
		ORDER BY tags.name ASC`,
		paperID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := make([]string, 0)
	for rows.Next() {
		var tag string
		if err := rows.Scan(&tag); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	return tags, rows.Err()
}

func (repository *PaperRepository) getNote(ctx context.Context, paperID string) (string, error) {
	var note string
	err := repository.db.QueryRowContext(ctx, "SELECT content FROM notes WHERE paper_id = ?", paperID).Scan(&note)
	if err == sql.ErrNoRows {
		return "", nil
	}
	return note, err
}
