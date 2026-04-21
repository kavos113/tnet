import { getProjectRoot } from './projectRoot';

const imagePrefix = '/_images/';

export const convertObsidianImageLinks = (markdown: string): string => {
  return markdown.replace(/!\[\[(.*?)]]/g, (_, filename: string) => {
    const encoded = encodeURIComponent(filename);
    return `![${filename}](file:///${getProjectRoot()}${imagePrefix}${encoded})`;
  });
};
