export const minPaperListPanePercent = 25;
export const maxPaperListPanePercent = 75;

export const clampPaperListPanePercent = (value: number): number =>
  Math.min(Math.max(value, minPaperListPanePercent), maxPaperListPanePercent);

export const getPaperListPanePercent = ({
  clientX,
  containerLeft,
  containerWidth
}: {
  clientX: number;
  containerLeft: number;
  containerWidth: number;
}): number => {
  if (containerWidth <= 0) return 40;
  return clampPaperListPanePercent(((clientX - containerLeft) / containerWidth) * 100);
};
