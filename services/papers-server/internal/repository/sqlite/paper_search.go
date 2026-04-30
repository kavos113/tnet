package sqlite

import (
	"context"
	"database/sql"
	"strings"
)

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
