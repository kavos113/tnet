export const tooltipOffset = 12;
export const tooltipMinimumPosition = 8;

export interface TooltipPosition {
  x: number;
  y: number;
}

export const getTooltipPosition = (event: MouseEvent, containerRect: DOMRect): TooltipPosition => ({
  x: Math.max(tooltipMinimumPosition, event.clientX - containerRect.left + tooltipOffset),
  y: Math.max(tooltipMinimumPosition, event.clientY - containerRect.top + tooltipOffset)
});
