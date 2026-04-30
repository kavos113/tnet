package sqlite

import (
	"context"
	"database/sql"
	"strings"

	"github.com/google/uuid"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

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
		if _, err := tx.ExecContext(ctx, "INSERT OR IGNORE INTO paper_tags (paper_id, tag_id) VALUES (?, ?)", paperID, tagID); err != nil {
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
		if _, err := tx.ExecContext(ctx, "DELETE FROM paper_tags WHERE paper_id = ? AND tag_id = ?", paperID, tagID); err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, paperID)
	})
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}
