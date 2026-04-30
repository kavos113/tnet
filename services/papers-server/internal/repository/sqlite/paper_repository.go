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

func (repository *PaperRepository) ListTags(ctx context.Context) ([]model.PaperTag, error) {
	rows, err := repository.db.QueryContext(ctx, "SELECT id, name, color FROM tags ORDER BY name ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tags := make([]model.PaperTag, 0)
	for rows.Next() {
		var tag model.PaperTag
		var color sql.NullString
		if err := rows.Scan(&tag.ID, &tag.Name, &color); err != nil {
			return nil, err
		}
		tag.Color = valueString(color)
		tags = append(tags, tag)
	}
	return tags, rows.Err()
}

func (repository *PaperRepository) UpsertTag(
	ctx context.Context,
	name string,
	color string,
) (model.PaperTag, error) {
	normalizedName := strings.TrimSpace(name)
	if normalizedName == "" {
		return model.PaperTag{}, errRequired("tag name")
	}

	var existing model.PaperTag
	var existingColor sql.NullString
	err := repository.db.QueryRowContext(
		ctx,
		"SELECT id, name, color FROM tags WHERE name = ?",
		normalizedName,
	).Scan(&existing.ID, &existing.Name, &existingColor)
	if err != nil && err != sql.ErrNoRows {
		return model.PaperTag{}, err
	}
	if err == nil {
		existing.Color = valueString(existingColor)
		if color != "" && color != existing.Color {
			_, err := repository.db.ExecContext(ctx, "UPDATE tags SET color = ? WHERE id = ?", color, existing.ID)
			if err != nil {
				return model.PaperTag{}, err
			}
			existing.Color = color
		}
		return existing, nil
	}

	tag := model.PaperTag{ID: uuid.NewString(), Name: normalizedName, Color: color}
	_, err = repository.db.ExecContext(
		ctx,
		"INSERT INTO tags (id, name, color) VALUES (?, ?, ?)",
		tag.ID,
		tag.Name,
		nullString(tag.Color),
	)
	return tag, err
}

func (repository *PaperRepository) AttachTag(
	ctx context.Context,
	paperID string,
	tagID string,
) (model.Paper, bool, error) {
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			"INSERT OR IGNORE INTO paper_tags (paper_id, tag_id) VALUES (?, ?)",
			paperID,
			tagID,
		)
		if err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, paperID)
	})
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}

func (repository *PaperRepository) DetachTag(
	ctx context.Context,
	paperID string,
	tagID string,
) (model.Paper, bool, error) {
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			"DELETE FROM paper_tags WHERE paper_id = ? AND tag_id = ?",
			paperID,
			tagID,
		)
		if err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, paperID)
	})
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}

func (repository *PaperRepository) SaveNote(
	ctx context.Context,
	paperID string,
	content string,
) (model.Paper, bool, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		_, err := tx.ExecContext(
			ctx,
			`INSERT INTO notes (paper_id, content, updated_at)
			VALUES (?, ?, ?)
			ON CONFLICT(paper_id) DO UPDATE SET
				content = excluded.content,
				updated_at = excluded.updated_at`,
			paperID,
			content,
			now,
		)
		if err != nil {
			return err
		}
		_, err = tx.ExecContext(ctx, "UPDATE papers SET updated_at = ? WHERE id = ?", now, paperID)
		if err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, paperID)
	})
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}

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

func refreshSearchIndex(ctx context.Context, tx *sql.Tx, paperID string) error {
	var title string
	var abstract sql.NullString
	err := tx.QueryRowContext(ctx, "SELECT title, abstract FROM papers WHERE id = ?", paperID).Scan(&title, &abstract)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}

	rows, err := tx.QueryContext(ctx, "SELECT name FROM paper_authors WHERE paper_id = ? ORDER BY position ASC", paperID)
	if err != nil {
		return err
	}
	authors := make([]string, 0)
	for rows.Next() {
		var author string
		if err := rows.Scan(&author); err != nil {
			_ = rows.Close()
			return err
		}
		authors = append(authors, author)
	}
	if err := rows.Close(); err != nil {
		return err
	}

	var note sql.NullString
	err = tx.QueryRowContext(ctx, "SELECT content FROM notes WHERE paper_id = ?", paperID).Scan(&note)
	if err != nil && err != sql.ErrNoRows {
		return err
	}

	tagRows, err := tx.QueryContext(
		ctx,
		`SELECT tags.name
		FROM tags
		JOIN paper_tags ON paper_tags.tag_id = tags.id
		WHERE paper_tags.paper_id = ?
		ORDER BY tags.name`,
		paperID,
	)
	if err != nil {
		return err
	}
	var tags []string
	for tagRows.Next() {
		var tag string
		if err := tagRows.Scan(&tag); err != nil {
			_ = tagRows.Close()
			return err
		}
		tags = append(tags, tag)
	}
	if err := tagRows.Close(); err != nil {
		return err
	}

	_, err = tx.ExecContext(ctx, "DELETE FROM paper_search WHERE paper_id = ?", paperID)
	if err != nil {
		return err
	}
	_, err = tx.ExecContext(
		ctx,
		"INSERT INTO paper_search (paper_id, title, authors, abstract, note, tags) VALUES (?, ?, ?, ?, ?, ?)",
		paperID,
		title,
		strings.Join(authors, ", "),
		valueString(abstract),
		valueString(note),
		strings.Join(tags, ", "),
	)
	return err
}

func withTx(ctx context.Context, db *sql.DB, run func(*sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	if err := run(tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	return tx.Commit()
}

func toFTSQuery(query string) string {
	terms := strings.Fields(strings.TrimSpace(query))
	quoted := make([]string, 0, len(terms))
	for _, term := range terms {
		term = strings.ReplaceAll(term, `"`, `""`)
		if term != "" {
			quoted = append(quoted, `"`+term+`"`)
		}
	}
	return strings.Join(quoted, " AND ")
}

func nullString(value string) sql.NullString {
	return sql.NullString{String: value, Valid: value != ""}
}

func nullInt32(value int32) sql.NullInt64 {
	return sql.NullInt64{Int64: int64(value), Valid: value != 0}
}

func valueString(value sql.NullString) string {
	if !value.Valid {
		return ""
	}
	return value.String
}

func errRequired(field string) error {
	return &requiredFieldError{field: field}
}

type requiredFieldError struct {
	field string
}

func (err *requiredFieldError) Error() string {
	return err.field + " is required"
}
