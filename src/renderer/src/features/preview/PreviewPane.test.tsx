import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import mermaid from 'mermaid';
import { PreviewPane } from './PreviewPane';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    run: vi.fn().mockResolvedValue(undefined)
  }
}));

const keywordGetContent = vi.fn();
const openInternalLink = vi.fn();
const imageLoadDataUrl = vi.fn();
const toggleTask = vi.fn();

const renderPreviewPane = (markdown: string): void => {
  render(
    <PreviewPane
      markdown={markdown}
      showOutline={true}
      onOpenInternalLink={openInternalLink}
      onToggleTask={toggleTask}
      loadKeywordContent={keywordGetContent}
      loadImageDataUrl={imageLoadDataUrl}
    />
  );
};

describe('PreviewPane', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    keywordGetContent.mockReset();
    openInternalLink.mockReset();
    imageLoadDataUrl.mockReset();
    toggleTask.mockReset();
    imageLoadDataUrl.mockResolvedValue(null);
  });

  it('shows rendered keyword content while hovering an internal link', async () => {
    let resolveKeyword: (content: string) => void = () => {};
    keywordGetContent.mockReturnValue(
      new Promise((resolve) => {
        resolveKeyword = resolve;
      })
    );

    renderPreviewPane('See [[/docs/keyword.md|Keyword]].');

    const link = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.mouseOver(link, { clientX: 20, clientY: 30 });

    expect(await screen.findByText('Loading...')).toBeInTheDocument();
    const loadingTooltip = screen.getByText('Loading...').closest('.internal-link-tooltip');
    expect(loadingTooltip).toHaveStyle({ left: '32px', top: '42px' });

    fireEvent.mouseOver(link, { clientX: 80, clientY: 90, relatedTarget: link });
    expect(keywordGetContent).toHaveBeenCalledTimes(1);
    expect(loadingTooltip).toHaveStyle({ left: '32px', top: '42px' });

    await act(async () => resolveKeyword('**Tooltip** body'));

    expect(await screen.findByText('Tooltip')).toBeInTheDocument();
    expect(keywordGetContent).toHaveBeenCalledWith('/docs/keyword.md', 'Keyword');
  });

  it('uses a missing message when keyword content is not found', async () => {
    keywordGetContent.mockResolvedValue(null);

    renderPreviewPane('See [[/docs/keyword.md|Missing]].');

    const link = await screen.findByRole('link', { name: 'Missing' });
    fireEvent.mouseOver(link);

    expect(await screen.findByText('Keyword not found.')).toBeInTheDocument();
  });

  it('hides the tooltip when the cursor leaves or the link is clicked', async () => {
    keywordGetContent.mockResolvedValue('Tooltip body');

    renderPreviewPane('See [[/docs/keyword.md|Keyword]].');

    const link = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.mouseOver(link);
    expect(await screen.findByText('Tooltip body')).toBeInTheDocument();

    const visibleLink = await screen.findByRole('link', { name: 'Keyword' });
    act(() => {
      visibleLink.dispatchEvent(
        new window.MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })
      );
    });
    await waitFor(() => {
      expect(screen.queryByText('Tooltip body')).not.toBeInTheDocument();
    });

    const linkAfterHide = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.mouseOver(linkAfterHide);
    expect(await screen.findByText('Tooltip body')).toBeInTheDocument();

    const linkWithTooltip = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.pointerDown(linkWithTooltip);
    expect(screen.queryByText('Tooltip body')).not.toBeInTheDocument();
    expect(openInternalLink).not.toHaveBeenCalled();

    fireEvent.click(linkWithTooltip);
    await waitFor(() => {
      expect(screen.queryByText('Tooltip body')).not.toBeInTheDocument();
      expect(openInternalLink).toHaveBeenCalledWith('/docs/keyword.md');
    });
  });

  it('does not restore a loading tooltip after the link is clicked', async () => {
    let resolveKeyword: (content: string) => void = () => {};
    keywordGetContent.mockReturnValue(
      new Promise((resolve) => {
        resolveKeyword = resolve;
      })
    );

    renderPreviewPane('See [[/docs/keyword.md|Keyword]].');

    const link = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.mouseOver(link);
    expect(await screen.findByText('Loading...')).toBeInTheDocument();

    const loadingLink = await screen.findByRole('link', { name: 'Keyword' });
    fireEvent.pointerDown(loadingLink);
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    fireEvent.click(loadingLink);

    await act(async () => resolveKeyword('Tooltip body'));
    expect(screen.queryByText('Tooltip body')).not.toBeInTheDocument();
  });

  it('opens an internal link when the click target is the link text node', async () => {
    renderPreviewPane('See [[/docs/text-target.md|Text Target]].');

    const link = await screen.findByRole('link', { name: 'Text Target' });
    const textNode = link.firstChild;
    expect(textNode).not.toBeNull();

    act(() => {
      textNode?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    await waitFor(() => {
      expect(openInternalLink).toHaveBeenCalledWith('/docs/text-target.md');
    });
  });

  it('renders a right-side outline from preview headings', async () => {
    renderPreviewPane(['# Title', '', '## Section', '', '### Detail'].join('\n'));

    const outline = await screen.findByRole('navigation', { name: 'Preview outline' });

    expect(outline).toHaveTextContent('Title');
    expect(outline).toHaveTextContent('Section');
    expect(outline).toHaveTextContent('Detail');
    expect(screen.getByRole('button', { name: 'Section' }).closest('li')).toHaveClass(
      'preview-outline-level-2'
    );
  });

  it('scrolls the preview to an outline heading', async () => {
    renderPreviewPane(['# Title', '', '## Target'].join('\n'));
    const scrollIntoView = vi
      .spyOn(HTMLElement.prototype, 'scrollIntoView')
      .mockImplementation(() => undefined);

    await screen.findByRole('heading', { name: 'Target' });
    fireEvent.click(await screen.findByRole('button', { name: 'Target' }));

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  });

  it('renders Obsidian images with loaded data URLs instead of local file URLs', async () => {
    imageLoadDataUrl.mockResolvedValue('data:image/png;base64,aW1hZ2U=');

    renderPreviewPane('![[Pasted image 20250218201040.png]]');

    const image = await screen.findByRole('img', { name: 'Pasted image 20250218201040.png' });
    expect(image).toHaveAttribute('src', 'data:image/png;base64,aW1hZ2U=');
    expect(imageLoadDataUrl).toHaveBeenCalledWith('Pasted image 20250218201040.png');
  });

  it('does not run Mermaid rendering when the preview has no Mermaid blocks', async () => {
    renderPreviewPane('# Plain');

    await screen.findByText('Plain');
    expect(mermaid.run).not.toHaveBeenCalled();
  });

  it('toggles markdown task list items when clicking preview checkboxes', async () => {
    renderPreviewPane('- [ ] task');

    const checkbox = await screen.findByRole('checkbox');
    fireEvent.click(checkbox);

    expect(toggleTask).toHaveBeenCalledWith(1, true);
  });
});
