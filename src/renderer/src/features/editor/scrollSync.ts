export const getScrollRatio = (element: HTMLElement): number => {
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  if (maxScrollTop <= 0) return 0;
  return element.scrollTop / maxScrollTop;
};

export const applyScrollRatio = (element: HTMLElement, ratio: number): void => {
  const maxScrollTop = element.scrollHeight - element.clientHeight;
  element.scrollTop = maxScrollTop <= 0 ? 0 : maxScrollTop * ratio;
};
