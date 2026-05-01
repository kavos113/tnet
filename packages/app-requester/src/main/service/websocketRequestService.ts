import type { SaveRequesterRequestInput } from '@tnet/app-requester/shared/requesterTypes';

export interface WebSocketClient {
  send(data: string): void;
  close(): void;
}

export interface WebSocketClientFactory {
  connect(url: string, headers: Record<string, string>): Promise<WebSocketClient>;
}

export class WebSocketRequestService {
  constructor(private readonly factory: WebSocketClientFactory) {}

  async run(request: SaveRequesterRequestInput): Promise<void> {
    const headers = Object.fromEntries(
      (request.headers ?? [])
        .filter((row) => row.enabled && row.key.trim())
        .map((row) => [row.key, row.value])
    );
    const client = await this.factory.connect(request.url, headers);
    try {
      for (const message of request.websocketMessages ?? []) {
        client.send(message);
      }
    } finally {
      client.close();
    }
  }
}
