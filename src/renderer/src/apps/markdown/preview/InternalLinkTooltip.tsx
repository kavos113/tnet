import { type RefObject } from 'react';
import { type InternalLinkTooltipState } from './internalLinkTooltipState';
import { useInternalLinkTooltip } from './useInternalLinkTooltip';

interface InternalLinkTooltipProps {
  tooltip: InternalLinkTooltipState;
}

interface InternalLinkTooltipControllerProps {
  containerRef: RefObject<HTMLDivElement | null>;
  onOpenInternalLink: (filePath: string) => void;
  loadKeywordContent: (filePath: string, name: string) => Promise<string | null>;
}

export const InternalLinkTooltip = ({
  tooltip
}: InternalLinkTooltipProps): React.JSX.Element | null => {
  if (!tooltip.visible) return null;

  return (
    <div
      className="internal-link-tooltip"
      style={{ left: tooltip.x, top: tooltip.y }}
      dangerouslySetInnerHTML={{ __html: tooltip.html }}
    />
  );
};

export const InternalLinkTooltipController = ({
  containerRef,
  onOpenInternalLink,
  loadKeywordContent
}: InternalLinkTooltipControllerProps): React.JSX.Element => {
  const tooltip = useInternalLinkTooltip({
    containerRef,
    onOpenInternalLink,
    loadKeywordContent
  });

  return <InternalLinkTooltip tooltip={tooltip} />;
};
