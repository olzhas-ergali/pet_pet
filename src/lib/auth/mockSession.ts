import type { AuthUserView } from '@/lib/api/auth';

export const MOCK_SESSION_KEY = 'optbirja_mock_session';

/** Демо-пользователь без Supabase (только import.meta.env.DEV + VITE_AUTH_MOCK). */
export const MOCK_DEMO_USER: AuthUserView = {
  id: '00000000-0000-4000-8000-000000000001',
  phone: null,
  email: 'demo@local.optbirja',
  role: 'customer',
  displayName: 'Demo',
};

export function isAuthMockEnabled(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_AUTH_MOCK === 'true';
}
