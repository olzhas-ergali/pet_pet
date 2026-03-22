import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { BffClientError } from '@/lib/api/bffClientError';

/** Включить BFF: VITE_USE_BFF=true и запущен server (см. README) */
export function isBffEnabled(): boolean {
  return import.meta.env.VITE_USE_BFF === 'true';
}

function apiBase(): string {
  const custom = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (custom) return `${custom.replace(/\/$/, '')}/api/v1`;
  return '/api/v1';
}

async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase()!;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function bffFetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new BffClientError('network');
  }

  if (res.status === 401) {
    await res.text().catch(() => {});
    throw new BffClientError('unauthorized', 'Unauthorized', 401);
  }
  if (res.status >= 502 && res.status <= 504) {
    await res.text().catch(() => {});
    throw new BffClientError('unavailable', res.statusText, res.status);
  }

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      try {
        const t = await res.text();
        if (t) msg = t.slice(0, 200);
      } catch {
        /* noop */
      }
    }
    throw new BffClientError('http', msg, res.status);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new BffClientError('unavailable', 'Invalid JSON response');
  }
}

/** POST validate-cart: 400 с телом { ok: false } — не бросаем, парсим */
export async function bffValidateCart(
  lines: { product_id: string; quantity: number }[]
): Promise<import('@/lib/api/orderErrors').ValidateCartResult> {
  const token = await getAccessToken();
  const url = `${apiBase()}/orders/validate-cart`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ lines }),
    });
  } catch {
    return { ok: false, code: 'bff_unavailable' };
  }

  if (res.status === 401) {
    await res.text().catch(() => {});
    return { ok: false, code: 'auth_required' };
  }
  if (res.status >= 502 && res.status <= 504) {
    await res.text().catch(() => {});
    return { ok: false, code: 'bff_unavailable' };
  }

  let json: Record<string, unknown> = {};
  try {
    json = (await res.json()) as Record<string, unknown>;
  } catch {
    if (!res.ok) {
      return { ok: false, code: 'bff_unavailable' };
    }
    return { ok: false, code: 'rpc_error' };
  }

  if (res.status === 400 && json?.ok === false) {
    const issues = Array.isArray(json.issues)
      ? (json.issues as { product_id: string; available: number; requested: number }[])
      : undefined;
    return {
      ok: false,
      code: (json.code as string) ?? 'unknown',
      issues,
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      code: 'bff_unavailable',
    };
  }
  if (json.ok === true) return { ok: true };
  const issues = Array.isArray(json.issues)
    ? (json.issues as { product_id: string; available: number; requested: number }[])
    : undefined;
  return { ok: false, code: (json.code as string) ?? 'unknown', issues };
}
