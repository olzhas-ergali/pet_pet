import { randomUUID } from 'node:crypto';
import type { Response } from 'express';

const hideDetails =
  process.env.NODE_ENV === 'production' || process.env.BFF_SAFE_ERRORS === '1';

export function sendInternalError(res: Response, err: unknown, logLabel = 'bff'): void {
  const requestId = randomUUID();
  const e = err instanceof Error ? err : new Error(String(err));
  console.error(`[${logLabel}] ${requestId}`, e.message, e.stack);
  res.status(500).json({
    error: hideDetails ? 'Internal server error' : e.message,
    requestId,
  });
}
