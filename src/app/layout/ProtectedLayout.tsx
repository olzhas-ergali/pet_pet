import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { usePricesRealtime } from '@/hooks/usePricesRealtime';
import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
import { SessionSplash } from '../components/SessionSplash';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { RealtimeStatusBanner } from '../components/RealtimeStatusBanner';

export function ProtectedLayout() {
  const { t } = useTranslation();
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);

  const canPriceRealtime = ready && Boolean(user) && isSupabaseConfigured;
  usePricesRealtime(canPriceRealtime);
  useOrdersRealtime(canPriceRealtime);
  const navigate = useNavigate();
  const loc = useLocation();
  const { lang } = useParams<{ lang: string }>();
  const authPath = lang ? `/${lang}/auth` : '/ru/auth';

  useEffect(() => {
    if (!ready || !isSupabaseConfigured) return;
    if (!user) {
      navigate(authPath, {
        replace: true,
        state: { from: { pathname: loc.pathname + loc.search } },
      });
    }
  }, [ready, user, loc.pathname, loc.search, navigate, authPath]);

  if (!ready) {
    return <SessionSplash />;
  }

  if (isSupabaseConfigured && !user) {
    return <SessionSplash />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100">
      {!isSupabaseConfigured && (
        <div className="bg-amber-500 text-white text-sm text-center py-2 px-4 z-50 relative">
          {t('protected.noSupabase')}
        </div>
      )}
      <div className="sticky top-0 z-[60] border-b border-gray-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-sm">
        <RealtimeStatusBanner />
        <div className="flex justify-end items-center gap-2 px-3 py-2">
          <LanguageSwitcher />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
