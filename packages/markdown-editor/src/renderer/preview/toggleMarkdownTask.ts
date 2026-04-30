const taskMarkerRegex = /^(\s*(?:[-+*]|\d+\.)\s+\[)( |x|X)(\])(.*)$/;

export const toggleMarkdownTask = (
  markdown: string,
  sourceLine: number,
  checked: boolean
): string => {
  if (sourceLine < 1) return markdown;

  const lines = markdown.split('\n');
  const index = sourceLine - 1;
  if (index < 0 || index >= lines.length) return markdown;

  const currentLine = lines[index];
  const match = taskMarkerRegex.exec(currentLine);
  if (!match) return markdown;

  lines[index] = `${match[1]}${checked ? 'x' : ' '}${match[3]}${match[4]}`;
  return lines.join('\n');
};
