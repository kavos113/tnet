package sqlite

import (
	"context"
	"database/sql"
)

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
