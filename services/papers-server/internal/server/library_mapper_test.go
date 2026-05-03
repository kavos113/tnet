package server

import (
	"reflect"
	"testing"

	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func TestLibraryConfigMappers(t *testing.T) {
	testcases := []struct {
		name  string
		proto *papersv1.PapersLibraryConfig
		want  model.PapersLibraryConfig
	}{
		{
			name:  "nil proto returns defaults",
			proto: nil,
			want:  model.DefaultPapersLibraryConfig(),
		},
		{
			name: "maps fields",
			proto: &papersv1.PapersLibraryConfig{
				ListDensity:            "compact",
				PdfZoomMode:            "page-fit",
				NoteEditorMode:         "editor",
				NoteAutoSaveDebounceMs: 250,
				NoteEditorFontFamily:   "JetBrains Mono",
				NoteEditorFontSize:     14,
				NotePreviewFontFamily:  "Inter",
				NotePreviewFontSize:    15,
			},
			want: model.PapersLibraryConfig{
				ListDensity:            "compact",
				PDFZoomMode:            "page-fit",
				NoteEditorMode:         "editor",
				NoteAutoSaveDebounceMs: 250,
				NoteEditorFontFamily:   "JetBrains Mono",
				NoteEditorFontSize:     14,
				NotePreviewFontFamily:  "Inter",
				NotePreviewFontSize:    15,
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got := fromProtoLibraryConfig(testcase.proto)
			if !reflect.DeepEqual(got, testcase.want) {
				t.Fatalf("fromProtoLibraryConfig() = %+v, want %+v", got, testcase.want)
			}
			proto := toProtoLibraryConfig(got)
			if got.ListDensity != proto.ListDensity || got.PDFZoomMode != proto.PdfZoomMode {
				t.Fatalf("toProtoLibraryConfig() = %+v, want values from %+v", proto, got)
			}
		})
	}
}

func TestGlobalConfigMappers(t *testing.T) {
	testcases := []struct {
		name  string
		proto *papersv1.PapersGlobalConfig
		want  model.PapersGlobalConfig
	}{
		{
			name:  "nil proto returns defaults",
			proto: nil,
			want:  model.DefaultPapersGlobalConfig(),
		},
		{
			name: "maps fields",
			proto: &papersv1.PapersGlobalConfig{
				LibraryRoots:        []string{"C:/papers", "D:/papers"},
				ActiveLibraryRoot:   "D:/papers",
				LastOpenedDirectory: "articles",
			},
			want: model.PapersGlobalConfig{
				LibraryRoots:        []string{"C:/papers", "D:/papers"},
				ActiveLibraryRoot:   "D:/papers",
				LastOpenedDirectory: "articles",
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got := fromProtoGlobalConfig(testcase.proto)
			if !reflect.DeepEqual(got, testcase.want) {
				t.Fatalf("fromProtoGlobalConfig() = %+v, want %+v", got, testcase.want)
			}
			proto := toProtoGlobalConfig(got)
			if !reflect.DeepEqual(proto.LibraryRoots, got.LibraryRoots) || proto.ActiveLibraryRoot != got.ActiveLibraryRoot {
				t.Fatalf("toProtoGlobalConfig() = %+v, want values from %+v", proto, got)
			}
		})
	}
}
