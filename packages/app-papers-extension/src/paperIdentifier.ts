export interface PaperIdentifiers {
  doi?: string;
  arxivId?: string;
  pdfUrl?: string;
}

const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const arxivPattern =
  /arxiv\.org\/(?:abs|pdf)\/([0-9]{4}\.[0-9]{4,5}(?:v\d+)?|[a-z-]+\/[0-9]{7}(?:v\d+)?)/i;

export const detectPaperIdentifiers = (input: string): PaperIdentifiers => {
  const doiMatch = input.match(doiPattern);
  const arxivMatch = input.match(arxivPattern);
  const url = safeUrl(input);

  return {
    doi: doiMatch?.[0],
    arxivId: arxivMatch?.[1],
    pdfUrl: url?.pathname.toLowerCase().endsWith('.pdf') ? url.toString() : undefined
  };
};

const safeUrl = (input: string): URL | null => {
  try {
    return new URL(input);
  } catch {
    return null;
  }
};
