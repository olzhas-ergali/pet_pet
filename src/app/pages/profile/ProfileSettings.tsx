import { useTranslation } from 'react-i18next';
import { Moon, Sun } from 'lucide-react';
import { ProfilePageShell } from './ProfilePageShell';
import { Switch } from '../../components/ui/switch';
import { useThemeStore } from '@/store/themeStore';

export function ProfileSettings() {
  const { t } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <ProfilePageShell title={t('profile.settingsTitle')}>
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-5 space-y-6">
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
