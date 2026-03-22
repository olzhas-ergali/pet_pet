import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

export function OrderSuccess() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const orderId = params.get('id') ?? '';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('orderSuccess.title')}</h1>
        <p className="text-gray-600 mb-2">{t('orderSuccess.thanks')}</p>
        {orderId && (
          <p className="text-sm text-gray-500 font-mono mb-8 break-all max-w-md">
            {t('orderSuccess.number')}: {orderId}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <Link
            to="/catalog"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50"
          >
            {t('orderSuccess.toCatalog')}
          </Link>
          <Link
            to="/profile"
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
