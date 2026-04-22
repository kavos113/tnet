import fs from 'fs/promises';
import path from 'path';
import type {
  SearchFileResult,
  SearchLineMatch,
  WorkspaceSearchIndexStats,
  WorkspaceSearchRequest,
  WorkspaceSearchResponse
} from '@shared/search/searchTypes';

interface IndexedLine {
  id: number;
  filePath: string;
  relativePath: string;
  lineNumber: number;
  lineText: string;
  normalizedLine: string;
  grams: string[];
}

interface WorkspaceSearchIndex {
  rootDir: string;
  nextLineId: number;
  lines: Map<number, IndexedLine>;
  fileLineIds: Map<string, Set<number>>;
  gramLineIds: Map<string, Set<number>>;
}

const markdownExtensions = new Set(['.md', '.markdown']);
const excludedDirectoryNames = new Set(['.tnet', '_images', '.git', 'node_modules']);
const defaultLimit = 200;
const maxMatchesPerFile = 20;
const gramSize = 3;

const indexes = new Map<string, WorkspaceSearchIndex>();
const buildPromises = new Map<string, Promise<WorkspaceSearchIndexStats>>();

const normalizeRoot = (rootDir: string): string => path.resolve(rootDir);

const isMarkdownFile = (filePath: string): boolean =>
  markdownExtensions.has(path.extname(filePath).toLowerCase());

const isExcludedDirectory = (directoryName: string): boolean =>
  excludedDirectoryNames.has(directoryName);

const emptyResponse = (
  status: WorkspaceSearchResponse['status'] = 'ready',
  stats: WorkspaceSearchIndexStats = { indexedFileCount: 0, indexedLineCount: 0 }
): WorkspaceSearchResponse => ({
  status,
  files: [],
  totalMatches: 0,
  truncated: false,
  indexedFileCount: stats.indexedFileCount,
  indexedLineCount: stats.indexedLineCount
});

const createIndex = (rootDir: string): WorkspaceSearchIndex => ({
  rootDir,
  nextLineId: 1,
  lines: new Map(),
  fileLineIds: new Map(),
  gramLineIds: new Map()
});

const uniqueGrams = (value: string): string[] => {
  if (value.length < gramSize) return [];
  const grams = new Set<string>();
  for (let index = 0; index <= value.length - gramSize; index += 1) {
    grams.add(value.slice(index, index + gramSize));
  }
  return Array.from(grams);
};

const indexStats = (index: WorkspaceSearchIndex): WorkspaceSearchIndexStats => ({
  indexedFileCount: index.fileLineIds.size,
  indexedLineCount: index.lines.size
});

const walkMarkdownFiles = async (directoryPath: string): Promise<string[]> => {
  const entries = await fs.readdir(directoryPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directoryPath, entry.name);
    if (entry.isDirectory()) {
      if (isExcludedDirectory(entry.name)) continue;
      try {
        files.push(...(await walkMarkdownFiles(fullPath)));
      } catch {
        // Ignore unreadable directories and keep the rest of the workspace searchable.
      }
      continue;
    }

    if (entry.isFile() && isMarkdownFile(fullPath)) files.push(fullPath);
  }

  return files;
};

const removeLine = (index: WorkspaceSearchIndex, lineId: number): void => {
  const line = index.lines.get(lineId);
  if (!line) return;

  for (const gram of line.grams) {
    const lineIds = index.gramLineIds.get(gram);
    if (!lineIds) continue;
    lineIds.delete(lineId);
    if (lineIds.size === 0) index.gramLineIds.delete(gram);
  }

  index.lines.delete(lineId);
};

const removeFileFromIndex = (index: WorkspaceSearchIndex, filePath: string): void => {
  const normalizedPath = path.resolve(filePath);
  const lineIds = index.fileLineIds.get(normalizedPath);
  if (!lineIds) return;

  for (const lineId of lineIds) removeLine(index, lineId);
  index.fileLineIds.delete(normalizedPath);
};

const addFileToIndex = async (index: WorkspaceSearchIndex, filePath: string): Promise<void> => {
  if (!isMarkdownFile(filePath)) return;

  const normalizedPath = path.resolve(filePath);
  const relativePath = path.relative(index.rootDir, normalizedPath).replace(/\\/g, '/');
  const content = await fs.readFile(normalizedPath, 'utf-8');
  const lineIds = new Set<number>();

  content.split(/\r?\n/).forEach((lineText, offset) => {
    const normalizedLine = lineText.toLowerCase();
    const grams = uniqueGrams(normalizedLine);
    const id = index.nextLineId;
    index.nextLineId += 1;

    const line: IndexedLine = {
      id,
      filePath: normalizedPath,
      relativePath,
      lineNumber: offset + 1,
      lineText,
      normalizedLine,
      grams
    };
    index.lines.set(id, line);
    lineIds.add(id);

    for (const gram of grams) {
      const gramLineIds = index.gramLineIds.get(gram) ?? new Set<number>();
      gramLineIds.add(id);
      index.gramLineIds.set(gram, gramLineIds);
    }
  });

  index.fileLineIds.set(normalizedPath, lineIds);
};

const candidateLineIds = (index: WorkspaceSearchIndex, normalizedQuery: string): Set<number> => {
  if (normalizedQuery.length < gramSize) return new Set(index.lines.keys());

  const grams = uniqueGrams(normalizedQuery);
  if (grams.length === 0) return new Set(index.lines.keys());

  const sortedPostingLists = grams
    .map((gram) => index.gramLineIds.get(gram) ?? new Set<number>())
    .sort((a, b) => a.size - b.size);

  if (sortedPostingLists.length === 0 || sortedPostingLists[0].size === 0) return new Set();

  const candidates = new Set(sortedPostingLists[0]);
  for (const postingList of sortedPostingLists.slice(1)) {
    for (const lineId of Array.from(candidates)) {
      if (!postingList.has(lineId)) candidates.delete(lineId);
    }
  }
  return candidates;
};

const rangesFor = (normalizedLine: string, normalizedQuery: string): SearchLineMatch['ranges'] => {
  const ranges: SearchLineMatch['ranges'] = [];
  let index = normalizedLine.indexOf(normalizedQuery);

  while (index !== -1) {
    ranges.push({ start: index, end: index + normalizedQuery.length });
    index = normalizedLine.indexOf(normalizedQuery, index + normalizedQuery.length);
  }

  return ranges;
};

export const rebuildWorkspaceSearchIndex = async (
  rootDir: string
): Promise<WorkspaceSearchIndexStats> => {
  if (!rootDir) return { indexedFileCount: 0, indexedLineCount: 0 };
  const root = normalizeRoot(rootDir);
  const existingBuild = buildPromises.get(root);
  if (existingBuild) return existingBuild;

  const buildPromise = (async (): Promise<WorkspaceSearchIndexStats> => {
    const index = createIndex(root);
    const files = await walkMarkdownFiles(root);
    for (const filePath of files) {
      try {
        await addFileToIndex(index, filePath);
      } catch {
        // Ignore unreadable files and keep the rest of the index available.
      }
    }
    indexes.set(root, index);
    return indexStats(index);
  })();

  buildPromises.set(root, buildPromise);
  try {
    return await buildPromise;
  } finally {
    buildPromises.delete(root);
  }
};

const ensureIndex = async (rootDir: string): Promise<WorkspaceSearchIndex | null> => {
  if (!rootDir) return null;
  const root = normalizeRoot(rootDir);
  if (!indexes.has(root)) await rebuildWorkspaceSearchIndex(root);
  return indexes.get(root) ?? null;
};

export const searchWorkspace = async (
  request: WorkspaceSearchRequest
): Promise<WorkspaceSearchResponse> => {
  const query = request.query.trim().toLowerCase();
  const index = await ensureIndex(request.rootDir);
  const stats = index ? indexStats(index) : { indexedFileCount: 0, indexedLineCount: 0 };
  if (!index || !query) return emptyResponse('ready', stats);

  const limit = Math.max(1, request.limit ?? defaultLimit);
  const files = new Map<string, SearchFileResult>();
  let totalMatches = 0;

  const candidates = Array.from(candidateLineIds(index, query))
    .map((lineId) => index.lines.get(lineId))
    .filter((line): line is IndexedLine => line !== undefined)
    .sort(
      (a, b) =>
        a.relativePath.localeCompare(b.relativePath) || a.lineNumber - b.lineNumber || a.id - b.id
    );

  for (const line of candidates) {
    if (!line.normalizedLine.includes(query)) continue;

    totalMatches += 1;
    if (totalMatches > limit) continue;

    const fileResult =
      files.get(line.filePath) ??
      ({
        path: line.filePath,
        relativePath: line.relativePath,
        matches: []
      } satisfies SearchFileResult);

    if (fileResult.matches.length < maxMatchesPerFile) {
      fileResult.matches.push({
        lineNumber: line.lineNumber,
        lineText: line.lineText,
        ranges: rangesFor(line.normalizedLine, query)
      });
    }
    files.set(line.filePath, fileResult);
  }

  return {
    status: 'ready',
    files: Array.from(files.values()).filter((file) => file.matches.length > 0),
    totalMatches,
    truncated: totalMatches > limit,
    indexedFileCount: stats.indexedFileCount,
    indexedLineCount: stats.indexedLineCount
  };
};

export const upsertWorkspaceSearchFile = async (
  rootDir: string,
  filePath: string
): Promise<void> => {
  const index = await ensureIndex(rootDir);
  if (!index) return;
  const normalizedPath = path.resolve(filePath);

  try {
    const stat = await fs.stat(normalizedPath);
    if (stat.isDirectory()) {
      const files = await walkMarkdownFiles(normalizedPath);
      for (const childPath of files) {
        removeFileFromIndex(index, childPath);
        await addFileToIndex(index, childPath);
      }
      return;
    }

    removeFileFromIndex(index, normalizedPath);
    await addFileToIndex(index, normalizedPath);
  } catch {
    // Leave the previous file entry removed if the file became unreadable.
    removeFileFromIndex(index, normalizedPath);
  }
};

export const removeWorkspaceSearchPath = async (
  rootDir: string,
  targetPath: string
): Promise<void> => {
  const index = await ensureIndex(rootDir);
  if (!index) return;
  const normalizedTarget = path.resolve(targetPath);
  const targetPrefix = `${normalizedTarget}${path.sep}`;

  for (const filePath of Array.from(index.fileLineIds.keys())) {
    if (filePath === normalizedTarget || filePath.startsWith(targetPrefix)) {
      removeFileFromIndex(index, filePath);
    }
  }
};

export const renameWorkspaceSearchPath = async ({
  rootDir,
  oldPath,
  newPath
}: {
  rootDir: string;
  oldPath: string;
  newPath: string;
}): Promise<void> => {
  await removeWorkspaceSearchPath(rootDir, oldPath);
  await upsertWorkspaceSearchFile(rootDir, newPath);
};
