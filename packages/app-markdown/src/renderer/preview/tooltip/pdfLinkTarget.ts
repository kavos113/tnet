export const closestPdfLink = (target: EventTarget | null): HTMLAnchorElement | null => {
  const element =
    target instanceof Element ? target : target instanceof Text ? target.parentElement : null;
  return element?.closest<HTMLAnchorElement>('a[data-pdf-link="true"]') ?? null;
};
