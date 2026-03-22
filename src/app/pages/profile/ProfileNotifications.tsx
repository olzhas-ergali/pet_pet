import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { ProfilePageShell } from './ProfilePageShell';

export function ProfileNotifications() {
  const { t } = useTranslation();

  return (
    <ProfilePageShell title={t('profile.notificationsPageTitle')}>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
          <Bell className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
          <p>{t('profile.notificationsPageHint')}</p>
        </div>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
            {t('profile.notificationsItemPrices')}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden />
            {t('profile.notificationsItemOrders')}
          </li>
        </ul>
      </div>
    </ProfilePageShell>
  );
}
