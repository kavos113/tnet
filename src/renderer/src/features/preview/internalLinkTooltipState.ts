export interface InternalLinkTooltipState {
  visible: boolean;
  x: number;
  y: number;
  html: string;
}

export const emptyInternalLinkTooltip: InternalLinkTooltipState = {
  visible: false,
  x: 0,
  y: 0,
  html: ''
};
