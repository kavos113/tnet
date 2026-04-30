package sqlite

import (
	"context"
	"database/sql"
	"time"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func (repository *PaperRepository) SaveNote(
	ctx context.Context,
	paperID string,
	content string,
) (model.Paper, bool, error) {
	now := time.Now().UTC().Format(time.RFC3339Nano)
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		if _, err := tx.ExecContext(
			ctx,
			`INSERT INTO notes (paper_id, content, updated_at)
			VALUES (?, ?, ?)
			ON CONFLICT(paper_id) DO UPDATE SET
				content = excluded.content,
				updated_at = excluded.updated_at`,
			paperID,
			content,
			now,
		); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, "UPDATE papers SET updated_at = ? WHERE id = ?", now, paperID); err != nil {
			return err
		}
		return refreshSearchIndex(ctx, tx, paperID)
	})
	if err != nil {
		return model.Paper{}, false, err
	}
	return repository.GetPaper(ctx, paperID)
}
