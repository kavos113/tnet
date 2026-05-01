export interface SseEvent {
  event: string;
  data: string;
  id?: string;
  retry?: number;
}

export const parseSseChunk = (input: string): SseEvent[] => {
  const events: SseEvent[] = [];
  for (const block of input.replace(/\r\n/g, '\n').split('\n\n')) {
    if (!block.trim()) continue;
    const event: SseEvent = { event: 'message', data: '' };
    const dataLines: string[] = [];
    for (const line of block.split('\n')) {
      if (!line || line.startsWith(':')) continue;
      const separator = line.indexOf(':');
      const field = separator >= 0 ? line.slice(0, separator) : line;
      const value = separator >= 0 ? line.slice(separator + 1).replace(/^ /, '') : '';
      if (field === 'event') event.event = value || 'message';
      if (field === 'data') dataLines.push(value);
      if (field === 'id') event.id = value;
      if (field === 'retry') {
        const retry = Number(value);
        if (Number.isFinite(retry)) event.retry = retry;
      }
    }
    event.data = dataLines.join('\n');
    events.push(event);
  }
  return events;
};
