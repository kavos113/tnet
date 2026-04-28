export type ObsidianImageSrcResolver = (filename: string) => Promise<string | null>;

const fallbackImagePrefix = '/_images/';

const escapeMarkdownAlt = (value: string): string => value.replace(/]/g, '\\]');

export const convertObsidianImageLinks = async (
  markdown: string,
  resolveImageSrc?: ObsidianImageSrcResolver
): Promise<string> => {
  const matches = Array.from(markdown.matchAll(/!\[\[(.*?)]]/g));
  if (matches.length === 0) return markdown;

  let converted = markdown;
  for (const match of matches) {
    const filename = match[1];
    const resolvedSrc = resolveImageSrc ? await resolveImageSrc(filename) : null;
    const src = resolvedSrc ?? `${fallbackImagePrefix}${encodeURIComponent(filename)}`;
    converted = converted.replace(match[0], `![${escapeMarkdownAlt(filename)}](${src})`);
  }

  return converted;
};
