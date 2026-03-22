import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';
import { ProfilePageShell } from './ProfilePageShell';

export function ProfilePayment() {
  const { t } = useTranslation();

  return (
    <ProfilePageShell title={t('profile.paymentPageTitle')}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
          <CreditCard className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          <p>{t('profile.paymentPageHint')}</p>
        </div>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 p-8 text-center text-sm text-gray-500">
          {t('profile.paymentEmpty')}
        </div>
      </div>
    </ProfilePageShell>
  );
}
