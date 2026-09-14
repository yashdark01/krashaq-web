export interface RunEvent {
  type: string;
  data: Record<string, unknown>;
}
/** Reconnect a durable run stream after transient transport interruption. */
export async function consumeRunEvents(
  url: string,
  onEvent: (event: RunEvent) => void,
  signal?: AbortSignal,
) {
  let cursor = '',
    finished = false;
  for (let attempt = 0; attempt < 3 && !finished; attempt++) {
    try {
      const response = await fetch(url, {
        headers: cursor ? { 'last-event-id': cursor } : {},
        signal,
      });
      if (!response.ok || !response.body)
        throw new Error('Unable to connect to the response stream');
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = '';
      try {
        while (!finished) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) >= 0) {
            const block = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const lines = block.split('\n');
            const type = lines.find((l) => l.startsWith('event: '))?.slice(7),
              raw = lines.find((l) => l.startsWith('data: '))?.slice(6),
              id = lines.find((l) => l.startsWith('id: '))?.slice(4);
            if (!type || !raw) continue;
            if (id) cursor = id;
            onEvent({ type, data: JSON.parse(raw) });
            if (type === 'done') finished = true;
          }
        }
      } finally {
        await reader.cancel().catch(() => {});
        reader.releaseLock();
      }
      if (!finished) throw new Error('Response stream ended before completion');
    } catch (error) {
      if (signal?.aborted || attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
}
