import { useState } from 'react';
import type { PaperDetail, PaperTag } from '@tnet/app-papers/shared/paperTypes';
import styles from './PaperMetadataPanel.module.css';

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
    <div className={styles.metadata}>
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
      {detail.abstract ? (
        <section className={styles.abstract} aria-label="Paper abstract">
          <h3>Abstract</h3>
          <p>{detail.abstract}</p>
        </section>
      ) : null}
      <section className={styles.tags} aria-label="Paper tags">
        <h3>Tags</h3>
        <div className={styles.tagList}>
          {availableTags.map((tag) => {
            const isAttached = attachedTagNames.has(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                className={`${styles.tagChip} ${isAttached ? styles.tagChipActive : ''}`}
                aria-pressed={isAttached}
                onClick={() => (isAttached ? onDetachTag(tag.id) : onAttachTag(tag.id))}
              >
                {tag.name}
              </button>
            );
          })}
          {availableTags.length === 0 ? <span className={styles.noTags}>No tags.</span> : null}
        </div>
        <label className={styles.newTag}>
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
