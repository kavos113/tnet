export const closestInternalLink = (target: EventTarget | null): HTMLAnchorElement | null => {
  const element =
    target instanceof HTMLElement ? target : target instanceof Text ? target.parentElement : null;
  return element?.closest<HTMLAnchorElement>('a[data-internal-link="true"]') ?? null;
};

export const isInsideSameLink = (
  link: HTMLAnchorElement,
  relatedTarget: EventTarget | null
): boolean => {
  return relatedTarget instanceof Node && link.contains(relatedTarget);
};
