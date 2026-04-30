package sqlite

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/google/uuid"
	paperlogic "github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

type PaperRepository struct {
	db *sql.DB
}

func NewPaperRepository(db *sql.DB) *PaperRepository {
	return &PaperRepository{db: db}
}

func (repository *PaperRepository) CreatePaper(
	ctx context.Context,
	input paperlogic.CreatePaperInput,
) (model.Paper, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return model.Paper{}, errRequired("title")
	}

	if input.PDFPath != "" {
		existing, ok, err := repository.GetPaperByPDFPath(ctx, input.PDFPath)
		if err != nil {
			return model.Paper{}, err
		}
		if ok {
			return existing, nil
		}
	}

	id := uuid.NewString()
	now := time.Now().UTC().Format(time.RFC3339Nano)
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			`INSERT INTO papers (
				id, title, abstract, published_year, venue, doi, arxiv_id, url,
				pdf_path, directory_path, created_at, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			id,
			title,
			nullString(input.Abstract),
			nullInt32(input.PublishedYear),
			nullString(input.Venue),
			nullString(input.DOI),
			nullString(input.ArxivID),
			nullString(input.URL),
			nullString(input.PDFPath),
			input.DirectoryPath,
			now,
			now,
		)
		if err != nil {
			return err
		}

		for index, author := range input.Authors {
			_, err := tx.ExecContext(
				ctx,
				"INSERT INTO paper_authors (id, paper_id, name, position) VALUES (?, ?, ?, ?)",
				uuid.NewString(),
				id,
				author,
				index,
			)
			if err != nil {
				return err
			}
		}

		_, err = tx.ExecContext(
			ctx,
			"INSERT INTO notes (paper_id, content, updated_at) VALUES (?, ?, ?)",
			id,
			input.NoteContent,
			now,
		)
		if err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, id)
	})
	if err != nil {
		return model.Paper{}, err
	}

	paper, ok, err := repository.GetPaper(ctx, id)
	if err != nil {
		return model.Paper{}, err
	}
	if !ok {
		return model.Paper{}, errRequired("created paper")
	}
	return paper, nil
}

func (repository *PaperRepository) ListPapers(
	ctx context.Context,
	filter paperlogic.ListFilter,
) ([]model.Paper, error) {
	where := make([]string, 0)
	args := make([]interface{}, 0)

	if filter.HasDirectory {
		where = append(where, "papers.directory_path = ?")
		args = append(args, filter.DirectoryPath)
	}
	if fts := toFTSQuery(filter.Query); fts != "" {
		where = append(where, "papers.id IN (SELECT paper_id FROM paper_search WHERE paper_search MATCH ?)")
		args = append(args, fts)
	}
	for _, tagID := range filter.TagIDs {
		where = append(where, `EXISTS (
			SELECT 1 FROM paper_tags
			WHERE paper_tags.paper_id = papers.id AND paper_tags.tag_id = ?
		)`)
		args = append(args, tagID)
	}

	query := "SELECT id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path FROM papers"
	if len(where) > 0 {
		query += " WHERE " + strings.Join(where, " AND ")
	}
	query += " ORDER BY updated_at DESC"

	rows, err := repository.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	papers := make([]model.Paper, 0)
	for rows.Next() {
		paper, err := scanPaperBase(rows)
		if err != nil {
			return nil, err
		}
		papers = append(papers, paper)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	if err := rows.Close(); err != nil {
		return nil, err
	}

	for index := range papers {
		paper, err := repository.hydratePaper(ctx, papers[index])
		if err != nil {
			return nil, err
		}
		papers[index] = paper
	}
	return papers, nil
}

func (repository *PaperRepository) GetPaper(
	ctx context.Context,
	id string,
) (model.Paper, bool, error) {
	row := repository.db.QueryRowContext(
		ctx,
		"SELECT id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path FROM papers WHERE id = ?",
		id,
	)
	paper, err := repository.scanPaper(ctx, row)
	if err == sql.ErrNoRows {
		return model.Paper{}, false, nil
	}
	if err != nil {
		return model.Paper{}, false, err
	}
	return paper, true, nil
}

func (repository *PaperRepository) GetPaperByIdentifiers(
	ctx context.Context,
	doi string,
	arxivID string,
) (model.Paper, bool, error) {
	where := make([]string, 0)
	args := make([]interface{}, 0)
	if doi != "" {
		where = append(where, "doi = ?")
		args = append(args, doi)
	}
	if arxivID != "" {
		where = append(where, "arxiv_id = ?")
		args = append(args, arxivID)
	}
	if len(where) == 0 {
		return model.Paper{}, false, nil
	}
	row := repository.db.QueryRowContext(
		ctx,
		"SELECT id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path FROM papers WHERE "+strings.Join(where, " OR ")+" LIMIT 1",
		args...,
	)
	paper, err := repository.scanPaper(ctx, row)
	if err == sql.ErrNoRows {
		return model.Paper{}, false, nil
	}
	if err != nil {
		return model.Paper{}, false, err
	}
	return paper, true, nil
}

func (repository *PaperRepository) GetPaperByPDFPath(
	ctx context.Context,
	pdfPath string,
) (model.Paper, bool, error) {
	row := repository.db.QueryRowContext(
		ctx,
		"SELECT id, title, abstract, published_year, venue, doi, arxiv_id, url, pdf_path, directory_path FROM papers WHERE pdf_path = ?",
		pdfPath,
	)
	paper, err := repository.scanPaper(ctx, row)
	if err == sql.ErrNoRows {
		return model.Paper{}, false, nil
	}
	if err != nil {
		return model.Paper{}, false, err
	}
	return paper, true, nil
}
