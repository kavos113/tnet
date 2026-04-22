import type { InternalLinkTooltipState } from '../internalLinkTooltipState';

export const tooltipOffset = 12;
export const tooltipMinimumPosition = 8;

export const getTooltipPosition = (
  event: MouseEvent,
  containerRect: DOMRect
): Pick<InternalLinkTooltipState, 'x' | 'y'> => ({
  x: Math.max(tooltipMinimumPosition, event.clientX - containerRect.left + tooltipOffset),
  y: Math.max(tooltipMinimumPosition, event.clientY - containerRect.top + tooltipOffset)
});
