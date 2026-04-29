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
	if path.IsAbs(normalized) || strings.Contains(normalized, "../") || normalized == ".." {
		return "", errors.New("relative path must stay inside the library")
	}

	return RelativePath(path.Clean(normalized)), nil
}

func (relativePath RelativePath) String() string {
	return string(relativePath)
}
