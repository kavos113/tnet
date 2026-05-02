export const closestPdfLink = (target: EventTarget | null): HTMLAnchorElement | null => {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLAnchorElement>('a[data-pdf-link="true"]');
};
