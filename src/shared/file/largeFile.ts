export const largeMarkdownFileThresholdBytes = 512 * 1024;

export const textByteLength = (content: string): number => new TextEncoder().encode(content).length;

export const isLargeMarkdownContent = (content: string): boolean =>
  textByteLength(content) >= largeMarkdownFileThresholdBytes;
