package server

import (
	"reflect"
	"testing"

	papersv1 "github.com/kavos113/tnet/services/papers-server/internal/gen/tnet/papers/v1"
	"github.com/kavos113/tnet/services/papers-server/internal/logic/paper"
	"github.com/kavos113/tnet/services/papers-server/internal/model"
)

func TestPaperAIOutputMappers(t *testing.T) {
	testcases := []struct {
		name  string
		proto *papersv1.PaperAiOutput
		want  model.PaperAIOutput
	}{
		{
			name:  "nil proto returns zero value",
			proto: nil,
			want:  model.PaperAIOutput{},
		},
		{
			name: "maps fields",
			proto: &papersv1.PaperAiOutput{
				PaperId:        "paper-1",
				Operation:      "summary",
				InputMode:      "abstract",
				TargetLanguage: "Japanese",
				Provider:       "mock",
				Model:          "mock-paper-ai",
				Content:        "summary",
				UpdatedAt:      "2026-05-03T00:00:00Z",
			},
			want: model.PaperAIOutput{
				PaperID:        "paper-1",
				Operation:      "summary",
				InputMode:      "abstract",
				TargetLanguage: "Japanese",
				Provider:       "mock",
				Model:          "mock-paper-ai",
				Content:        "summary",
				UpdatedAt:      "2026-05-03T00:00:00Z",
			},
		},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			got := fromProtoPaperAIOutput(testcase.proto)
			if !reflect.DeepEqual(got, testcase.want) {
				t.Fatalf("fromProtoPaperAIOutput() = %+v, want %+v", got, testcase.want)
			}
			proto := toProtoPaperAIOutput(got)
			if proto.PaperId != got.PaperID || proto.Content != got.Content {
				t.Fatalf("toProtoPaperAIOutput() = %+v, want values from %+v", proto, got)
			}
		})
	}
}

func TestPaperImportAndTagMappers(t *testing.T) {
	testcases := []struct {
		name string
	}{
		{name: "maps import response and tag"},
	}

	for _, testcase := range testcases {
		t.Run(testcase.name, func(t *testing.T) {
			response := toProtoImportPaperResponse(paper.ImportResult{
				Paper:          model.Paper{ID: "paper-1", Title: "Paper", PDFPath: "papers/paper.pdf"},
				AlreadyExists:  true,
				DuplicateField: "doi",
			})
			if response.Paper.Id != "paper-1" || !response.Paper.HasPdf || !response.AlreadyExists || response.DuplicateField != "doi" {
				t.Fatalf("toProtoImportPaperResponse() = %+v", response)
			}

			tag := toProtoPaperTag(model.PaperTag{ID: "tag-1", Name: "ai", Color: "#123456"})
			if tag.Id != "tag-1" || tag.Name != "ai" || tag.Color != "#123456" {
				t.Fatalf("toProtoPaperTag() = %+v", tag)
			}
		})
	}
}
