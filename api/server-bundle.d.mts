import type { IncomingMessage, ServerResponse } from 'node:http';

export function createApi(): (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) => Promise<void>;
