package model

import (
	"errors"
	"path/filepath"
	"strings"
)

type LibraryRoot string

func NewLibraryRoot(value string) (LibraryRoot, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "", errors.New("library root is required")
	}

	absolute, err := filepath.Abs(trimmed)
	if err != nil {
		return "", err
	}

	return LibraryRoot(filepath.Clean(absolute)), nil
}

func (root LibraryRoot) String() string {
	return string(root)
}
