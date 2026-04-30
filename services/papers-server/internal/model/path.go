package model

import (
	"errors"
	"path"
	"strings"
)

type RelativePath string

func NewRelativePath(value string) (RelativePath, error) {
	normalized := strings.ReplaceAll(strings.TrimSpace(value), "\\", "/")
	normalized = strings.Trim(normalized, "/")
	if normalized == "" {
		return "", nil
	}
	cleaned := path.Clean(normalized)
	if path.IsAbs(cleaned) || cleaned == ".." || strings.HasPrefix(cleaned, "../") {
		return "", errors.New("relative path must stay inside the library")
	}

	return RelativePath(cleaned), nil
}

func (relativePath RelativePath) String() string {
	return string(relativePath)
}
