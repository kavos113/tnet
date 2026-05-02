export interface DiscoveredFeedLink {
  title?: string;
  url: string;
}

export const discoverFeedLinks = (html: string, pageUrl: string): DiscoveredFeedLink[] =>
  [...html.matchAll(/<link\b([^>]*?)>/gi)]
    .map((match) => match[1])
    .filter((attrs) => /\brel=["'][^"']*alternate[^"']*["']/i.test(attrs))
    .filter((attrs) =>
      /\btype=["'](application\/rss\+xml|application\/atom\+xml|application\/feed\+json|application\/json)["']/i.test(
        attrs
      )
    )
    .map((attrs): DiscoveredFeedLink | undefined => {
      const href = attr(attrs, 'href');
      if (!href) return undefined;
      return {
        title: attr(attrs, 'title'),
        url: new URL(href, pageUrl).toString()
      };
    })
    .filter((link): link is DiscoveredFeedLink => link !== undefined);

const attr = (attrs: string, name: string): string | undefined =>
  attrs.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'))?.[1];
