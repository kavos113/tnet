package sqlite

import _ "embed"

//go:embed migrations/schema.sql
var schemaSQL string
