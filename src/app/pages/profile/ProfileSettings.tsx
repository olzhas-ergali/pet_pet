import { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Store, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { ProfilePageShell } from './ProfilePageShell';
import { Switch } from '../../components/ui/switch';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { updateMyProfileRole } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { mapRpcUserMessage } from '@/lib/api/orderErrors';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

export function ProfileSettings() {
  const { t } = useTranslation();
  const p = useLocalizedPath();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const user = useAuthStore((s) => s.user);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const [roleBusy, setRoleBusy] = useState(false);

  const role = user?.role ?? 'customer';
  const canToggleRole =
    isSupabaseConfigured && user && role !== 'admin';

  const handleBecomeSupplier = async () => {
    if (!canToggleRole) return;
    setRoleBusy(true);
    try {
      await updateMyProfileRole('supplier');
      await refreshProfile();
      toast.success(t('profile.accountRoleSupplierOk'));
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    } finally {
      setRoleBusy(false);
    }
  };

  const handleBecomeCustomer = async () => {
    if (!canToggleRole) return;
    setRoleBusy(true);
    try {
      await updateMyProfileRole('customer');
      await refreshProfile();
      toast.success(t('profile.accountRoleCustomerOk'));
    } catch (e) {
      toast.error(mapRpcUserMessage(e));
    } finally {
      setRoleBusy(false);
    }
  };

  return (
    <ProfilePageShell title={t('profile.settingsTitle')}>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-5 space-y-6">
        {user ? (
          <div className="space-y-4 pb-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
                {role === 'supplier' ? (
                  <Store className="w-5 h-5" aria-hidden />
                ) : (
                  <ShoppingBag className="w-5 h-5" aria-hidden />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-zinc-100">{t('profile.accountTypeTitle')}</p>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {role === 'admin'
                    ? t('profile.accountTypeAdmin')
                    : role === 'supplier'
                      ? t('profile.accountTypeSupplier')
                      : t('profile.accountTypeCustomer')}
                </p>
              </div>
            </div>
            {!isSupabaseConfigured ? (
              <p className="text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl px-3 py-2">
                {t('profile.accountTypeNoSupabase')}
              </p>
            ) : null}
            {role === 'customer' ? (
              <button
                type="button"
                disabled={!canToggleRole || roleBusy}
                onClick={() => void handleBecomeSupplier()}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-semibold text-sm disabled:opacity-50 hover:opacity-95 transition-opacity"
              >
                {t('profile.becomeSupplier')}
              </button>
            ) : null}
            {role === 'supplier' ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to={p('/supplier')}
                  className="flex-1 inline-flex items-center justify-center py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
                >
                  {t('profile.openSupplierCabinet')}
                </Link>
                <button
                  type="button"
                  disabled={roleBusy}
                  onClick={() => void handleBecomeCustomer()}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-zinc-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {t('profile.switchToBuyer')}
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 shrink-0">
              {theme === 'dark' ? <Moon className="w-5 h-5" aria-hidden /> : <Sun className="w-5 h-5" aria-hidden />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-zinc-100">{t('profile.themeDark')}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">
                {t('profile.themeDarkHint')}
              </p>
            </div>
          </div>
          <Switch
            checked={theme === 'dark'}
            onCheckedChange={(on) => setTheme(on ? 'dark' : 'light')}
            aria-label={t('profile.themeDark')}
          />
        </div>
      </div>
    </ProfilePageShell>
  );
}
