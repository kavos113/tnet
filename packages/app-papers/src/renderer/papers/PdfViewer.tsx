import { useEffect, useMemo, useState } from 'react';
import { papersTnetApi } from '../papersTnetApi';

interface PdfViewerProps {
  libraryRoot: string;
  pdfPath?: string;
}

const toBlobUrl = (bytes: ArrayBuffer): string =>
  URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));

export const PdfViewer = ({ libraryRoot, pdfPath }: PdfViewerProps): React.JSX.Element => {
  const [objectUrl, setObjectUrl] = useState('');
  const [error, setError] = useState('');
  const [zoom, setZoom] = useState('page-width');

  useEffect(() => {
    let revokedUrl = '';
    let canceled = false;

    const loadPdf = async (): Promise<void> => {
      setObjectUrl('');
      setError('');

      if (!libraryRoot || !pdfPath) return;

      try {
        const bytes = await papersTnetApi.papers.pdf.loadBytes({ libraryRoot, pdfPath });
        if (canceled) return;
        revokedUrl = toBlobUrl(bytes);
        setObjectUrl(revokedUrl);
      } catch (loadError) {
        console.error('Failed to load PDF', loadError);
        if (!canceled) setError('PDFを読み込めませんでした。');
      }
    };

    void loadPdf();

    return () => {
      canceled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [libraryRoot, pdfPath]);

  const iframeSrc = useMemo(() => {
    if (!objectUrl) return '';
    if (zoom === 'actual-size') return `${objectUrl}#zoom=100`;
    if (zoom === 'page-fit') return `${objectUrl}#view=Fit`;
    return `${objectUrl}#view=FitH`;
  }, [objectUrl, zoom]);

  const openExternal = async (): Promise<void> => {
    if (!libraryRoot || !pdfPath) return;
    await papersTnetApi.papers.pdf.openExternal({ libraryRoot, pdfPath });
  };

  if (!pdfPath) {
    return <div className="papers-empty-state">PDFが登録されていません。</div>;
  }

  return (
    <section className="papers-pdf-viewer" aria-label="PDF viewer">
      <div className="papers-pdf-toolbar">
        <span className="papers-pdf-name">{pdfPath}</span>
        <select
          className="papers-select"
          value={zoom}
          aria-label="PDF zoom"
          onChange={(event) => setZoom(event.target.value)}
        >
          <option value="page-width">Fit width</option>
          <option value="page-fit">Fit page</option>
          <option value="actual-size">100%</option>
        </select>
        <button className="icon-button" type="button" aria-label="Open PDF" onClick={openExternal}>
          <span className="material-icons-round" aria-hidden="true">
            open_in_new
          </span>
        </button>
      </div>
      {error ? <div className="papers-empty-state">{error}</div> : null}
      {!error && objectUrl ? (
        <iframe className="papers-pdf-frame" title={pdfPath} src={iframeSrc} />
      ) : null}
      {!error && !objectUrl ? <div className="papers-empty-state">PDFを読み込み中...</div> : null}
    </section>
  );
};
