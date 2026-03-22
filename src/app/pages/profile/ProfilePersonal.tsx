import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ProfilePageShell } from './ProfilePageShell';
import { ProfileCatalogShowcase } from './ProfileCatalogShowcase';

export function ProfilePersonal() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  return (
    <ProfilePageShell title={t('profile.personalPageTitle')}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800 p-6 space-y-4">
        <div className="flex items-center gap-3 text-gray-500 dark:text-zinc-400 text-sm">
          <User className="w-5 h-5" aria-hidden />
          {t('profile.personalPageHint')}
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
            <dt className="text-gray-500 dark:text-zinc-400">{t('profile.fieldPhone')}</dt>
            <dd className="font-medium text-gray-900 dark:text-zinc-100 text-right">
              {user?.phone ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 pb-3">
            <dt className="text-gray-500 dark:text-zinc-400">{t('profile.fieldEmail')}</dt>
            <dd className="font-medium text-gray-900 dark:text-zinc-100 text-right break-all">
              {user?.email ?? '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500 dark:text-zinc-400">{t('profile.fieldDisplayName')}</dt>
            <dd className="font-medium text-gray-900 dark:text-zinc-100 text-right">
              {user?.displayName ?? '—'}
            </dd>
          </div>
        </dl>
        {!isSupabaseConfigured && (
          <p className="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">{t('protected.noSupabase')}</p>
        )}
      </div>

      <div className="mt-6">
        <ProfileCatalogShowcase />
      </div>
    </ProfilePageShell>
  );
}
