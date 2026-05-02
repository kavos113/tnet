package sqlite

import (
	"context"
	"database/sql"
	"strings"
	"time"

	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func (repository *PaperRepository) ListPaperAIOutputs(
	ctx context.Context,
	paperID string,
) ([]model.PaperAIOutput, error) {
	rows, err := repository.db.QueryContext(
		ctx,
		`SELECT paper_id, operation, input_mode, target_language, provider, model, content, updated_at
		FROM paper_ai_outputs
		WHERE paper_id = ?
		ORDER BY updated_at DESC`,
		paperID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	outputs := make([]model.PaperAIOutput, 0)
	for rows.Next() {
		output, err := scanPaperAIOutput(rows)
		if err != nil {
			return nil, err
		}
		outputs = append(outputs, output)
	}
	return outputs, rows.Err()
}

func (repository *PaperRepository) SavePaperAIOutput(
	ctx context.Context,
	output model.PaperAIOutput,
) (model.PaperAIOutput, error) {
	normalized := normalizePaperAIOutput(output)
	if normalized.PaperID == "" {
		return model.PaperAIOutput{}, errRequired("paper_id")
	}
	if normalized.Operation == "" {
		return model.PaperAIOutput{}, errRequired("operation")
	}
	if normalized.InputMode == "" {
		return model.PaperAIOutput{}, errRequired("input_mode")
	}
	if normalized.Content == "" {
		return model.PaperAIOutput{}, errRequired("content")
	}
	now := time.Now().UTC().Format(time.RFC3339Nano)
	normalized.UpdatedAt = now
	err := withTx(ctx, repository.db, func(tx *sql.Tx) error {
		if _, err := tx.ExecContext(
			ctx,
			`INSERT INTO paper_ai_outputs (
				paper_id, operation, input_mode, target_language, provider, model, content, updated_at
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(paper_id, operation, input_mode, target_language) DO UPDATE SET
				provider = excluded.provider,
				model = excluded.model,
				content = excluded.content,
				updated_at = excluded.updated_at`,
			normalized.PaperID,
			normalized.Operation,
			normalized.InputMode,
			normalized.TargetLanguage,
			normalized.Provider,
			normalized.Model,
			normalized.Content,
			normalized.UpdatedAt,
		); err != nil {
			return err
		}
		_, err := tx.ExecContext(ctx, "UPDATE papers SET updated_at = ? WHERE id = ?", now, normalized.PaperID)
		return err
	})
	if err != nil {
		return model.PaperAIOutput{}, err
	}
	return normalized, nil
}

func normalizePaperAIOutput(output model.PaperAIOutput) model.PaperAIOutput {
	output.PaperID = strings.TrimSpace(output.PaperID)
	output.Operation = strings.TrimSpace(output.Operation)
	output.InputMode = strings.TrimSpace(output.InputMode)
	output.TargetLanguage = strings.TrimSpace(output.TargetLanguage)
	output.Provider = strings.TrimSpace(output.Provider)
	output.Model = strings.TrimSpace(output.Model)
	output.Content = strings.TrimSpace(output.Content)
	return output
}

func scanPaperAIOutput(scanner paperScanner) (model.PaperAIOutput, error) {
	var output model.PaperAIOutput
	err := scanner.Scan(
		&output.PaperID,
		&output.Operation,
		&output.InputMode,
		&output.TargetLanguage,
		&output.Provider,
		&output.Model,
		&output.Content,
		&output.UpdatedAt,
	)
	return output, err
}
