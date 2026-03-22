import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { SessionSplash } from '../components/SessionSplash';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { RealtimeStatusBanner } from '../components/RealtimeStatusBanner';

export function ProtectedLayout() {
  const { t } = useTranslation();
  const ready = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!ready || !isSupabaseConfigured) return;
    if (!user) {
      navigate('/auth', {
        replace: true,
        state: { from: { pathname: loc.pathname + loc.search } },
      });
    }
  }, [ready, user, loc.pathname, loc.search, navigate]);

  if (!ready) {
    return <SessionSplash />;
  }

  if (isSupabaseConfigured && !user) {
    return <SessionSplash />;
  }

  return (
    <>
      {!isSupabaseConfigured && (
        <div className="bg-amber-500 text-white text-sm text-center py-2 px-4 z-50 relative">
          {t('protected.noSupabase')}
        </div>
      )}
      <div className="sticky top-0 z-[60] border-b border-gray-100/80 bg-white/95 backdrop-blur-md shadow-sm">
        <RealtimeStatusBanner />
        <div className="flex justify-end items-center gap-2 px-3 py-2">
          <LanguageSwitcher />
        </div>
      </div>
      <Outlet />
    </>
  );
}
