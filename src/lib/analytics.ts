/**
 * Тонкая оболочка под продуктовую аналитику. По умолчанию no-op.
 *
 * Подключение:
 * - задать VITE_ANALYTICS_ENDPOINT (POST JSON { event, props, path }) или
 * - вызвать setAnalyticsSink((e,p)=>{ ... }) из своего кода.
 */
type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

let customSink: ((event: string, props: AnalyticsProps) => void) | null = null;

export function setAnalyticsSink(fn: (event: string, props: AnalyticsProps) => void) {
  customSink = fn;
}

export function track(event: string, props: AnalyticsProps = {}) {
  if (typeof window === 'undefined') return;

  if (customSink) {
    try {
      customSink(event, props);
    } catch {
      /* ignore */
    }
    return;
  }

  const url = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  if (!url?.trim()) return;

  const body = JSON.stringify({
    event,
    props,
    path: window.location.pathname,
    ts: Date.now(),
  });

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
      return;
    }
  } catch {
    /* fall through */
  }

  void fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}
