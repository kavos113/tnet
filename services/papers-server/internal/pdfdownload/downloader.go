package pdfdownload

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"path"
	"strings"
)

type DownloadedPDF struct {
	FileName string
	Bytes    []byte
}

type HTTPDownloader struct {
	client *http.Client
}

func NewHTTPDownloader(client *http.Client) *HTTPDownloader {
	if client == nil {
		client = http.DefaultClient
	}
	return &HTTPDownloader{client: client}
}

func (downloader *HTTPDownloader) Download(ctx context.Context, pdfURL string) (DownloadedPDF, error) {
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, pdfURL, nil)
	if err != nil {
		return DownloadedPDF{}, err
	}
	response, err := downloader.client.Do(request)
	if err != nil {
		return DownloadedPDF{}, err
	}
	defer response.Body.Close()

	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return DownloadedPDF{}, fmt.Errorf("download PDF failed with status %d", response.StatusCode)
	}
	bytes, err := io.ReadAll(response.Body)
	if err != nil {
		return DownloadedPDF{}, err
	}
	fileName := path.Base(request.URL.Path)
	if fileName == "." || fileName == "/" || fileName == "" || !strings.HasSuffix(strings.ToLower(fileName), ".pdf") {
		fileName = "paper.pdf"
	}
	return DownloadedPDF{FileName: fileName, Bytes: bytes}, nil
}
