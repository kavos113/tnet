export interface PreviewOutlineItem {
  id: string;
  level: number;
  text: string;
}

export const extractPreviewOutline = (container: HTMLElement): PreviewOutlineItem[] => {
  return Array.from(container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .map((heading) => ({
      id: heading.id,
      level: Number(heading.tagName.slice(1)),
      text: heading.textContent?.trim() ?? ''
    }))
    .filter((item) => item.id && item.text);
};

interface PreviewOutlineProps {
  items: PreviewOutlineItem[];
  onSelect: (id: string) => void;
}

export const PreviewOutline = ({ items, onSelect }: PreviewOutlineProps): React.JSX.Element => {
  if (items.length === 0) return <></>;

  return (
    <nav className="preview-outline" aria-label="Preview outline">
      <ul className="preview-outline-list">
        {items.map((item) => (
          <li key={item.id} className={`preview-outline-item preview-outline-level-${item.level}`}>
            <button
              type="button"
              className="preview-outline-link"
              title={item.text}
              onClick={() => onSelect(item.id)}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
