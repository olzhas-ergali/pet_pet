import type { CorsOptions } from 'cors';

/** Список origin через запятую. Если не задан — разрешены все (удобно для dev). */
export function bffCorsOptions(): CorsOptions {
  const raw = process.env.BFF_CORS_ORIGINS?.trim();
  if (!raw) {
    return { origin: true, credentials: true };
  }
  const allowed = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (allowed.length === 0) {
    return { origin: true, credentials: true };
  }
  return {
    credentials: true,
    origin(origin, cb) {
      if (!origin) {
        cb(null, true);
        return;
      }
      if (allowed.includes(origin)) {
        cb(null, true);
        return;
      }
      cb(new Error(`CORS blocked: ${origin}`));
    },
  };
}
