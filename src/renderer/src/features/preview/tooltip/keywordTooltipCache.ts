export class KeywordTooltipCache {
  private readonly cache = new Map<string, string | null>();

  static key(filePath: string, name: string): string {
    return `${filePath}::${name}`;
  }

  get(key: string): string | null | undefined {
    return this.cache.get(key);
  }

  set(key: string, content: string | null): void {
    this.cache.set(key, content);
  }
}
