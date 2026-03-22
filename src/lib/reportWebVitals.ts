import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';
import { track } from '@/lib/analytics';

function send(metric: Metric) {
  track('web_vital', {
    name: metric.name,
    value:
      metric.name === 'CLS'
        ? Math.round(metric.value * 10000) / 10
        : Math.round(metric.value),
    rating: metric.rating,
    id: metric.id,
    delta:
      metric.name === 'CLS'
        ? Math.round(metric.delta * 10000) / 10
        : Math.round(metric.delta),
  });
}

/**
 * Отправка Core Web Vitals в тот же слой, что и page_view (GA4 / свой endpoint через VITE_ANALYTICS_ENDPOINT).
 */
export function initWebVitalsReporting() {
  if (typeof window === 'undefined') return;
  onCLS(send);
  onINP(send);
  onLCP(send);
  onFCP(send);
  onTTFB(send);
}
