package sqlite

import "database/sql"

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
