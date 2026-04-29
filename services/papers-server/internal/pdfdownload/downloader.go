package pdfdownload

import (
	"bytes"
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

type Progress struct {
	DownloadedBytes int64
	TotalBytes      int64
}

type ProgressReporter func(Progress)

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
	return downloader.DownloadWithProgress(ctx, pdfURL, nil)
}

func (downloader *HTTPDownloader) DownloadWithProgress(
	ctx context.Context,
	pdfURL string,
	report ProgressReporter,
) (DownloadedPDF, error) {
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
	bytes, err := readAllWithProgress(response.Body, response.ContentLength, report)
	if err != nil {
		return DownloadedPDF{}, err
	}
	fileName := path.Base(request.URL.Path)
	if fileName == "." || fileName == "/" || fileName == "" || !strings.HasSuffix(strings.ToLower(fileName), ".pdf") {
		fileName = "paper.pdf"
	}
	return DownloadedPDF{FileName: fileName, Bytes: bytes}, nil
}

func readAllWithProgress(reader io.Reader, totalBytes int64, report ProgressReporter) ([]byte, error) {
	var buffer bytes.Buffer
	chunk := make([]byte, 32*1024)
	var downloadedBytes int64
	for {
		n, err := reader.Read(chunk)
		if n > 0 {
			downloadedBytes += int64(n)
			if _, writeErr := buffer.Write(chunk[:n]); writeErr != nil {
				return nil, writeErr
			}
			if report != nil {
				report(Progress{
					DownloadedBytes: downloadedBytes,
					TotalBytes:      max(totalBytes, 0),
				})
			}
		}
		if err == nil {
			continue
		}
		if err == io.EOF {
			return buffer.Bytes(), nil
		}
		return nil, err
	}
}
