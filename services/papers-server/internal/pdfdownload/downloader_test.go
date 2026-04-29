package pdfdownload

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHTTPDownloaderDownloadWithProgress(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("Content-Length", "7")
		_, _ = response.Write([]byte("pdfdata"))
	}))
	defer server.Close()
	downloader := NewHTTPDownloader(server.Client())
	var progress []Progress

	downloaded, err := downloader.DownloadWithProgress(
		context.Background(),
		server.URL+"/paper.pdf",
		RequestOptions{},
		func(next Progress) {
			progress = append(progress, next)
		},
	)
	if err != nil {
		t.Fatalf("DownloadWithProgress() error = %v", err)
	}

	if downloaded.FileName != "paper.pdf" {
		t.Fatalf("FileName = %q, want paper.pdf", downloaded.FileName)
	}
	if string(downloaded.Bytes) != "pdfdata" {
		t.Fatalf("Bytes = %q, want pdfdata", string(downloaded.Bytes))
	}
	if len(progress) == 0 {
		t.Fatal("expected progress reports")
	}
	last := progress[len(progress)-1]
	if last.DownloadedBytes != 7 || last.TotalBytes != 7 {
		t.Fatalf("last progress = %+v, want 7/7", last)
	}
}

func TestHTTPDownloaderDownloadWithProgressWithoutContentLength(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Del("Content-Length")
		response.(http.Flusher).Flush()
		_, _ = response.Write([]byte("pdfdata"))
	}))
	defer server.Close()
	downloader := NewHTTPDownloader(server.Client())
	var progress []Progress

	_, err := downloader.DownloadWithProgress(
		context.Background(),
		server.URL+"/paper.pdf",
		RequestOptions{},
		func(next Progress) {
			progress = append(progress, next)
		},
	)
	if err != nil {
		t.Fatalf("DownloadWithProgress() error = %v", err)
	}

	if len(progress) == 0 {
		t.Fatal("expected progress reports")
	}
	last := progress[len(progress)-1]
	if last.DownloadedBytes != 7 || last.TotalBytes != 0 {
		t.Fatalf("last progress = %+v, want 7/0", last)
	}
}

func TestHTTPDownloaderDownloadWithProgressSendsBrowserCompatibleHeaders(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		if request.Header.Get("User-Agent") == "" {
			t.Fatal("expected User-Agent header")
		}
		if request.Header.Get("Accept") == "" {
			t.Fatal("expected Accept header")
		}
		if request.Header.Get("Accept-Language") == "" {
			t.Fatal("expected Accept-Language header")
		}
		if request.Header.Get("Referer") != "https://example.test/paper" {
			t.Fatalf("Referer = %q, want source page URL", request.Header.Get("Referer"))
		}
		_, _ = response.Write([]byte("pdfdata"))
	}))
	defer server.Close()
	downloader := NewHTTPDownloader(server.Client())

	_, err := downloader.DownloadWithProgress(
		context.Background(),
		server.URL+"/paper.pdf",
		RequestOptions{Referer: "https://example.test/paper"},
		nil,
	)
	if err != nil {
		t.Fatalf("DownloadWithProgress() error = %v", err)
	}
}
