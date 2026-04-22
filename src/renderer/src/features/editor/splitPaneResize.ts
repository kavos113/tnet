export const minEditorPanePercent = 20;
export const maxEditorPanePercent = 80;

export const clampEditorPanePercent = (value: number): number => {
  return Math.min(Math.max(value, minEditorPanePercent), maxEditorPanePercent);
};

export const getEditorPanePercent = ({
  clientX,
  containerLeft,
  containerWidth
}: {
  clientX: number;
  containerLeft: number;
  containerWidth: number;
}): number => {
  if (containerWidth <= 0) return 50;
  return clampEditorPanePercent(((clientX - containerLeft) / containerWidth) * 100);
};
