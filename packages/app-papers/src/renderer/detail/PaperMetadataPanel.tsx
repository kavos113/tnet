import type { PaperDetail } from '@tnet/app-papers/shared/paperTypes';

export interface PaperMetadataPanelProps {
  detail: PaperDetail;
}

export const PaperMetadataPanel = ({ detail }: PaperMetadataPanelProps): React.JSX.Element => (
  <div className="papers-metadata">
    <dl>
      <dt>Venue</dt>
      <dd>{detail.venue ?? '-'}</dd>
      <dt>Year</dt>
      <dd>{detail.publishedYear ?? '-'}</dd>
      <dt>DOI</dt>
      <dd>{detail.doi ?? '-'}</dd>
      <dt>arXiv</dt>
      <dd>{detail.arxivId ?? '-'}</dd>
      <dt>PDF</dt>
      <dd>{detail.pdfPath ?? '-'}</dd>
    </dl>
  </div>
);
