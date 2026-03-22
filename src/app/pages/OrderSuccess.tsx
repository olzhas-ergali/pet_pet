import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchMyOrders } from '@/lib/api/orders';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

type VerifyState = 'idle' | 'loading' | 'ok' | 'fail' | 'skip';

export function OrderSuccess() {
  const { t } = useTranslation();
  const p = useLocalizedPath();
  const [params] = useSearchParams();
  const orderId = params.get('id') ?? '';
  const [verify, setVerify] = useState<VerifyState>('idle');

  useEffect(() => {
    if (!orderId.trim()) {
      setVerify('skip');
      return;
    }
    if (!isSupabaseConfigured) {
      setVerify('skip');
      return;
    }
    let cancelled = false;
    setVerify('loading');
    void fetchMyOrders()
      .then((rows) => {
        if (cancelled) return;
        const found = rows.some((o) => o.id === orderId);
        setVerify(found ? 'ok' : 'fail');
      })
      .catch(() => {
        if (!cancelled) setVerify('fail');
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const showOrderNumber = orderId && (verify === 'ok' || verify === 'skip');
  const showVerifyWarning = verify === 'fail';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('orderSuccess.title')}</h1>
        <p className="text-gray-600 mb-2">{t('orderSuccess.thanks')}</p>

        {verify === 'loading' && (
          <p className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            {t('orderSuccess.verifying')}
          </p>
        )}

        {showVerifyWarning && (
          <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 max-w-md mb-6 leading-relaxed">
            {t('orderSuccess.verifyFailed')}
          </p>
        )}

        {showOrderNumber && (
          <p className="text-sm text-gray-500 font-mono mb-8 break-all max-w-md">
            {t('orderSuccess.number')}: {orderId}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            to={p('/catalog')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50"
          >
            {t('orderSuccess.toCatalog')}
          </Link>
          <Link
            to={p('/profile')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl font-semibold"
          >
            {t('orderSuccess.orders')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
