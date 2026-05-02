import { createPartFromBase64, GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PapersGlobalSettings } from '@tnet/app-papers/shared/config';
import type { PaperAiRequest } from '@tnet/app-papers/shared/ipc';
import type { PaperAiOutput } from '@tnet/app-papers/shared/paperTypes';
import type { PapersServerClient } from './serverClient/papersServerClient';

export interface PaperAiService {
  run: (request: PaperAiRequest) => Promise<PaperAiOutput>;
}

export const createPaperAiService = ({
  serverClient,
  settingsLoader
}: {
  serverClient: PapersServerClient;
  settingsLoader: () => Promise<PapersGlobalSettings>;
}): PaperAiService => ({
  run: async (request) => {
    const settings = await settingsLoader();
    const pdfBytes = await serverClient.loadPdfBytes({
      libraryRoot: request.libraryRoot,
      pdfPath: requirePdfPath(request.pdfPath)
    });
    const content =
      request.inputMode === 'pdf-direct'
        ? await runPdfDirect(request, settings, pdfBytes)
        : await runTextBased(request, settings, pdfBytes);
    return serverClient.savePaperAiOutput({
      libraryRoot: request.libraryRoot,
      output: {
        paperId: request.paperId,
        operation: request.operation,
        inputMode: request.inputMode,
        targetLanguage: request.targetLanguage || settings.aiDefaultTargetLanguage,
        provider: settings.aiProvider,
        model: settings.aiModel,
        content,
        updatedAt: ''
      }
    });
  }
});

const runPdfDirect = async (
  request: PaperAiRequest,
  settings: PapersGlobalSettings,
  pdfBytes: ArrayBuffer
): Promise<string> => {
  if (settings.aiProvider === 'mock') return mockPaperAiResponse(request);
  const prompt = buildPaperAiPrompt(request);
  const base64Pdf = Buffer.from(pdfBytes).toString('base64');
  if (settings.aiProvider === 'openai-sdk') {
    const client = new OpenAI({
      apiKey: settings.aiApiKey.trim() || undefined,
      baseURL: settings.aiEndpoint.trim() || undefined,
      maxRetries: 0,
      timeout: settings.aiTimeoutMs
    });
    const response = await client.responses.create({
      model: settings.aiModel,
      instructions: paperAiInstructions,
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            {
              type: 'input_file',
              filename: 'paper.pdf',
              file_data: `data:application/pdf;base64,${base64Pdf}`
            }
          ]
        }
      ],
      max_output_tokens: settings.aiMaxOutputTokens
    });
    return response.output_text.trim();
  }
  if (settings.aiProvider === 'gemini-sdk') {
    const ai = new GoogleGenAI({
      apiKey: settings.aiApiKey.trim() || undefined,
      httpOptions: {
        baseUrl: settings.aiEndpoint.trim() || undefined,
        timeout: settings.aiTimeoutMs
      }
    });
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: [prompt, createPartFromBase64(base64Pdf, 'application/pdf')],
      config: {
        systemInstruction: paperAiInstructions,
        maxOutputTokens: settings.aiMaxOutputTokens
      }
    });
    return (response.text ?? '').trim();
  }
  throw new Error(`Unsupported paper AI provider: ${settings.aiProvider}`);
};

const runTextBased = async (
  request: PaperAiRequest,
  settings: PapersGlobalSettings,
  pdfBytes: ArrayBuffer
): Promise<string> => {
  const text = await extractPdfText(pdfBytes);
  if (settings.aiProvider === 'mock') return mockPaperAiResponse(request, text);
  const chunks = chunkText(text, settings.aiTextChunkChars);
  const partials: string[] = [];
  for (const [index, chunk] of chunks.entries()) {
    partials.push(await runTextPrompt(request, settings, chunk, chunks.length, index + 1));
  }
  if (partials.length === 1) return partials[0];
  return runTextPrompt(
    request,
    settings,
    partials.join('\n\n'),
    1,
    1,
    'Combine the following partial outputs into one coherent final result.'
  );
};

const runTextPrompt = async (
  request: PaperAiRequest,
  settings: PapersGlobalSettings,
  text: string,
  totalChunks: number,
  chunkIndex: number,
  overrideInstruction?: string
): Promise<string> => {
  const prompt = [
    overrideInstruction ?? buildPaperAiPrompt(request),
    totalChunks > 1 ? `This is chunk ${chunkIndex} of ${totalChunks}.` : '',
    text
  ]
    .filter(Boolean)
    .join('\n\n');
  if (settings.aiProvider === 'openai-sdk') {
    const client = new OpenAI({
      apiKey: settings.aiApiKey.trim() || undefined,
      baseURL: settings.aiEndpoint.trim() || undefined,
      maxRetries: 0,
      timeout: settings.aiTimeoutMs
    });
    const response = await client.responses.create({
      model: settings.aiModel,
      instructions: paperAiInstructions,
      input: prompt,
      max_output_tokens: settings.aiMaxOutputTokens
    });
    return response.output_text.trim();
  }
  if (settings.aiProvider === 'gemini-sdk') {
    const ai = new GoogleGenAI({
      apiKey: settings.aiApiKey.trim() || undefined,
      httpOptions: {
        baseUrl: settings.aiEndpoint.trim() || undefined,
        timeout: settings.aiTimeoutMs
      }
    });
    const response = await ai.models.generateContent({
      model: settings.aiModel,
      contents: prompt,
      config: {
        systemInstruction: paperAiInstructions,
        maxOutputTokens: settings.aiMaxOutputTokens
      }
    });
    return (response.text ?? '').trim();
  }
  throw new Error(`Unsupported paper AI provider: ${settings.aiProvider}`);
};

export const extractPdfText = async (pdfBytes: ArrayBuffer): Promise<string> => {
  const loadingTask = getDocument({ data: new Uint8Array(pdfBytes) });
  const pdfDocument = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      pages.push(
        textContent.items
          .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      );
    }
    return pages.join('\n\n');
  } finally {
    await pdfDocument.destroy();
  }
};

const paperAiInstructions =
  'You help a researcher read academic papers. Return concise Markdown. Do not invent claims that are not supported by the input.';

const buildPaperAiPrompt = (request: PaperAiRequest): string => {
  if (request.operation === 'translate') {
    return `Translate the paper into ${request.targetLanguage || 'Japanese'}. Preserve section structure where possible.`;
  }
  return `Summarize the paper in ${request.targetLanguage || 'Japanese'}. Include purpose, method, key findings, and limitations.`;
};

const chunkText = (text: string, chunkChars: number): string[] => {
  const size = Math.max(chunkChars, 1000);
  const chunks: string[] = [];
  for (let index = 0; index < text.length; index += size) {
    chunks.push(text.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [''];
};

const mockPaperAiResponse = (request: PaperAiRequest, text = ''): string =>
  `Mock ${request.operation} (${request.inputMode}) for ${request.targetLanguage || 'Japanese'}.${
    text ? `\n\n${text.slice(0, 200)}` : ''
  }`;

const requirePdfPath = (pdfPath?: string): string => {
  if (!pdfPath) throw new Error('PDF path is required.');
  return pdfPath;
};
