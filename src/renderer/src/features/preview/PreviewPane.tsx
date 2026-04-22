import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { openFile } from '@renderer/features/editor/editorSlice';
import { tnetApi } from '@renderer/lib/tnetApi';
import { useAppDispatch } from '@renderer/app/hooks';
import { InternalLinkTooltipController } from './InternalLinkTooltip';
import { markdownService } from './markdown/markdownService';
import 'highlight.js/styles/github.css';
import 'katex/dist/katex.min.css';

interface PreviewPaneProps {
  markdown: string;
}

export interface PreviewPaneHandle {
  getPreviewElement: () => HTMLElement | null;
}

export const PreviewPane = forwardRef<PreviewPaneHandle, PreviewPaneProps>(
  ({ markdown }, ref): React.JSX.Element => {
    const dispatch = useAppDispatch();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [html, setHtml] = useState('');

    const openInternalLink = useCallback(
      (filePath: string): void => {
        tnetApi.file
          .read(filePath)
          .then((content) => {
            dispatch(openFile({ path: filePath, content }));
          })
          .catch((error: unknown) => {
            console.error('Failed to open internal link', error);
          });
      },
      [dispatch]
    );

    useImperativeHandle(
      ref,
      () => ({
        getPreviewElement: () => containerRef.current
      }),
      []
    );

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

    return (
      <div className="preview-pane-root">
        <div
          ref={containerRef}
          className="markdown-preview"
          // The preview renders local workspace Markdown. The pipeline intentionally supports raw HTML,
          // matching the legacy editor behavior.
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <InternalLinkTooltipController
          containerRef={containerRef}
          onOpenInternalLink={openInternalLink}
        />
      </div>
    );
  }
);

PreviewPane.displayName = 'PreviewPane';
