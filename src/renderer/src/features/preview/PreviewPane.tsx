import { useEffect, useRef, useState } from 'react';
import { openFile } from '@renderer/features/editor/editorSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { useAppDispatch } from '@renderer/app/hooks';
import { markdownService } from './markdown/markdownService';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  markdown: string;
}

export const PreviewPane = ({ markdown }: PreviewPaneProps): React.JSX.Element => {
  const dispatch = useAppDispatch();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    let canceled = false;

    markdownService
      .parse(markdown)
      .then((nextHtml) => {
        if (!canceled) setHtml(nextHtml);
      })
      .catch((error: unknown) => {
        console.error('Failed to render markdown', error);
        if (!canceled) setHtml('<p>Failed to render markdown.</p>');
      });

    return () => {
      canceled = true;
    };
  }, [markdown]);

  useEffect(() => {
    if (!containerRef.current) return;
    markdownService.renderMermaid(containerRef.current).catch((error: unknown) => {
      console.error('Failed to render Mermaid diagrams', error);
    });
  }, [html]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onClick = (event: MouseEvent): void => {
      const target = event.target as HTMLElement;
      const link = target.closest('a[data-internal-link="true"]');
      if (!link) return;

      event.preventDefault();
      const filePath = link.getAttribute('data-path');
      if (!filePath) return;

      tnetApi.file
        .read(filePath)
        .then((content) => {
          dispatch(openFile({ path: filePath, content }));
        })
        .catch((error: unknown) => {
          console.error('Failed to open internal link', error);
        });
    };

    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [dispatch]);

  return (
    <div
      ref={containerRef}
      className="markdown-preview"
      // The preview renders local workspace Markdown. The pipeline intentionally supports raw HTML,
      // matching the legacy editor behavior.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
