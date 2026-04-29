import { useState } from 'react';
import type { PaperDetail, PaperTag } from '@tnet/app-papers/shared/paperTypes';

export interface PaperMetadataPanelProps {
  detail: PaperDetail;
  availableTags: PaperTag[];
  onCreateTag: (name: string) => void;
  onAttachTag: (tagId: string) => void;
  onDetachTag: (tagId: string) => void;
}

export const PaperMetadataPanel = ({
  detail,
  availableTags,
  onCreateTag,
  onAttachTag,
  onDetachTag
}: PaperMetadataPanelProps): React.JSX.Element => {
  const [newTagName, setNewTagName] = useState('');
  const attachedTagNames = new Set(detail.tags);

  const submitNewTag = (): void => {
    const name = newTagName.trim();
    if (!name) return;
    onCreateTag(name);
    setNewTagName('');
  };

  return (
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
      <section className="papers-detail-tags" aria-label="Paper tags">
        <h3>Tags</h3>
        <div className="papers-detail-tag-list">
          {availableTags.map((tag) => {
            const isAttached = attachedTagNames.has(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                className={`papers-detail-tag-chip ${isAttached ? 'active' : ''}`}
                aria-pressed={isAttached}
                onClick={() => (isAttached ? onDetachTag(tag.id) : onAttachTag(tag.id))}
              >
                {tag.name}
              </button>
            );
          })}
          {availableTags.length === 0 ? (
            <span className="papers-detail-no-tags">No tags.</span>
          ) : null}
        </div>
        <label className="papers-detail-new-tag">
          <span>New tag</span>
          <input
            value={newTagName}
            aria-label="New paper tag"
            placeholder="Add tag"
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitNewTag();
              }
            }}
          />
          <button type="button" aria-label="Add paper tag" onClick={submitNewTag}>
            Add
          </button>
        </label>
      </section>
    </div>
  );
};
