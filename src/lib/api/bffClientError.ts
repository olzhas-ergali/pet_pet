export type BffErrorKind = 'network' | 'unauthorized' | 'unavailable' | 'http';

/** Ошибки вызова BFF с клиента (сеть, 401, 5xx, прочий HTTP). */
export class BffClientError extends Error {
  readonly kind: BffErrorKind;
  readonly status?: number;

  constructor(kind: BffErrorKind, message?: string, status?: number) {
    super(message ?? kind);
    this.name = 'BffClientError';
    this.kind = kind;
    this.status = status;
  }
}

export function isBffClientError(e: unknown): e is BffClientError {
  return e instanceof BffClientError;
}
