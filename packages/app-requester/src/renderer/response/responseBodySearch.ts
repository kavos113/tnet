export interface TextSearchMatchRange {
  start: number;
  end: number;
}

export const getTextSearchMatchRanges = (text: string, query: string): TextSearchMatchRange[] => {
  if (!query) return [];

  const normalizedText = text.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const ranges: TextSearchMatchRange[] = [];
  let start = 0;

  while (start < text.length) {
    const matchStart = normalizedText.indexOf(normalizedQuery, start);
    if (matchStart === -1) break;
    const matchEnd = matchStart + query.length;
    ranges.push({ start: matchStart, end: matchEnd });
    start = matchEnd;
  }

  return ranges;
};
