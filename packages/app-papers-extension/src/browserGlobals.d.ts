interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
}

interface ChromeApi {
  runtime?: {
    onInstalled?: {
      addListener: (listener: () => void) => void;
    };
    onMessage?: {
      addListener: (
        listener: (
          message: unknown,
          sender: unknown,
          sendResponse: (response: unknown) => void
        ) => boolean
      ) => void;
    };
  };
  tabs?: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<ChromeTab[]>;
    sendMessage?: (tabId: number, message: unknown) => Promise<unknown>;
  };
}

interface Window {
  chrome?: ChromeApi;
}

declare const chrome: ChromeApi | undefined;
