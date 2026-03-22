import { create } from 'zustand';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { fetchProfile, signOut as apiSignOut, type AuthUserView } from '@/lib/api/auth';
import { useCartStore } from '@/store/cartStore';
import {
  MOCK_DEMO_USER,
  MOCK_SESSION_KEY,
  isAuthMockEnabled,
} from '@/lib/auth/mockSession';

type AuthState = {
  ready: boolean;
  user: AuthUserView | null;
  bootstrap: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  loginMockDemo: () => void;
};

let authListenerAttached = false;

function baseUserFromSession(session: Session | null): AuthUserView | null {
  if (!session?.user) return null;
  return {
    id: session.user.id,
    phone: session.user.phone ?? null,
    email: session.user.email ?? null,
    role: 'customer',
    displayName: null,
  };
}

async function mergeProfile(u: AuthUserView): Promise<AuthUserView> {
  const p = await fetchProfile(u.id);
  return {
    ...u,
    role: p?.role ?? u.role,
    displayName: p?.display_name ?? u.displayName,
    phone: p?.phone ?? u.phone,
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ready: false,
  user: null,

  bootstrap: async () => {
    if (!isSupabaseConfigured) {
      if (
        isAuthMockEnabled() &&
        typeof sessionStorage !== 'undefined' &&
        sessionStorage.getItem(MOCK_SESSION_KEY) === '1'
      ) {
        set({ user: MOCK_DEMO_USER, ready: true });
        return;
      }
      set({ ready: true, user: null });
      return;
    }
    const supabase = getSupabase()!;
    const { data } = await supabase.auth.getSession();
    let user = baseUserFromSession(data.session);
    if (user) user = await mergeProfile(user);
    set({ user, ready: true });

    if (!authListenerAttached) {
      authListenerAttached = true;
      supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
        if (event === 'INITIAL_SESSION') return;
        if (event === 'SIGNED_OUT') {
          useCartStore.getState().clearCart();
          set({ user: null });
          return;
        }
        if (event === 'SIGNED_IN' && session?.user) {
          const prev = get().user?.id;
          if (prev && prev !== session.user.id) {
            useCartStore.getState().clearCart();
          }
        }
        let u = baseUserFromSession(session);
        if (u) u = await mergeProfile(u);
        set({ user: u });
      });
    }
  },

  refreshProfile: async () => {
    const u = get().user;
    if (!u || !isSupabaseConfigured) return;
    set({ user: await mergeProfile(u) });
  },

  logout: async () => {
    if (
      isAuthMockEnabled() &&
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(MOCK_SESSION_KEY) === '1'
    ) {
      sessionStorage.removeItem(MOCK_SESSION_KEY);
      useCartStore.getState().clearCart();
      set({ user: null });
      return;
    }
    await apiSignOut();
    useCartStore.getState().clearCart();
    set({ user: null });
  },

  loginMockDemo: () => {
    if (!isAuthMockEnabled() || isSupabaseConfigured) return;
    sessionStorage.setItem(MOCK_SESSION_KEY, '1');
    set({ user: MOCK_DEMO_USER });
  },
}));
