import i18n from '@/i18n';

/** Человекочитаемые сообщения по ошибкам RPC / PostgREST */
export function mapSubmitOrderError(err: unknown): string {
  const raw = extractMessage(err);
  if (/insufficient stock|insufficient_stock/i.test(raw)) {
    return i18n.t('errors.submit.insufficient');
  }
  if (/empty cart|empty_cart/i.test(raw)) {
    return i18n.t('errors.submit.emptyCart');
  }
  if (/product or price missing/i.test(raw)) {
    return i18n.t('errors.submit.missingProduct');
  }
  if (/auth required|not authenticated|jwt/i.test(raw)) {
    return i18n.t('errors.submit.auth');
  }
  if (/invalid quantity/i.test(raw)) {
    return i18n.t('errors.submit.invalidQty');
  }
  if (/violates|foreign key|unique/i.test(raw)) {
    return i18n.t('errors.submit.db');
  }
  if (raw.length < 200) return raw;
  return i18n.t('errors.submit.generic');
}

/** Сообщения для toast/alert по типичным ошибкам PostgREST / сети */
export function mapRpcUserMessage(err: unknown): string {
  const msg = extractMessage(err);
  const raw = msg.toLowerCase();
  if (!raw.trim()) return i18n.t('errors.rpc.generic');
  if (/permission denied|rls|policy|42501/i.test(raw)) return i18n.t('errors.rpc.permission');
  if (/jwt|not authenticated|auth required|invalid login/i.test(raw)) return i18n.t('errors.rpc.auth');
  if (/network|failed to fetch|load failed|net::/i.test(raw)) return i18n.t('errors.rpc.network');
  if (/timeout|timed out/i.test(raw)) return i18n.t('errors.rpc.timeout');
  if (msg.length < 220) return msg;
  return i18n.t('errors.rpc.generic');
}

export function extractMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return String((err as { message?: string }).message ?? '');
  }
  return String(err);
}

export type StockIssue = {
  product_id: string;
  available: number;
  requested: number;
};

export type ValidateCartResult =
  | { ok: true }
  | {
      ok: false;
      code: string;
      issues?: StockIssue[];
    };

export function formatStockIssues(issues: StockIssue[] | undefined, names: Map<string, string>): string {
  if (!issues?.length) return i18n.t('errors.stock.generic');
  return issues
    .map((i) =>
      i18n.t('errors.stock.line', {
        label: names.get(i.product_id) ?? i18n.t('common.product'),
        requested: i.requested,
        available: i.available,
      })
    )
    .join('. ');
}
