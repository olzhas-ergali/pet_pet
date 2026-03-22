import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ProfileRow, UserRole } from '@/types/database';

/** До успешного OTP / dev-входа: какой role записать в профиль (новые + догон для существующих). */
export const SIGNUP_ROLE_STORAGE_KEY = 'optbirja-signup-role';

/** После входа открыть кабинет поставщика, если роль supplier. */
export const PREFER_SUPPLIER_PORTAL_KEY = 'optbirja-prefer-supplier';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10 && digits.startsWith('9')) {
    return `+7${digits}`;
  }
  if (digits.startsWith('8') && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return `+${digits}`;
  }
  if (raw.trim().startsWith('+')) return raw.trim();
  return `+${digits}`;
}

export type SignupAccountType = 'customer' | 'supplier';

export async function sendPhoneOtp(
  phone: string,
  opts?: { accountType?: SignupAccountType },
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase не настроен');
  const role: UserRole = opts?.accountType === 'supplier' ? 'supplier' : 'customer';
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizePhone(phone),
    options: {
      shouldCreateUser: true,
      data: { role },
    },
  });
  if (error) throw error;
}

export async function verifyPhoneOtp(phone: string, token: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase не настроен');
  const { error } = await supabase.auth.verifyOtp({
    phone: normalizePhone(phone),
    token: token.replace(/\s/g, ''),
    type: 'sms',
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabase();
  if (supabase) await supabase.auth.signOut();
}

/**
 * После verifyOtp / signIn: для новых пользователей role уже в профиле из триггера;
 * для существующих — подтягиваем supplier по намерению из sessionStorage.
 */
export async function applySignupRoleFromStorage(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const raw =
    typeof sessionStorage !== 'undefined'
      ? sessionStorage.getItem(SIGNUP_ROLE_STORAGE_KEY)
      : null;
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
  }
  if (raw !== 'supplier') return;

  const supabase = getSupabase()!;
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) return;

  const { data: row, error: selErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (selErr || !row || row.role === 'admin') return;

  const { error: upErr } = await supabase
    .from('profiles')
    .update({ role: 'supplier' })
    .eq('id', authData.user.id);
  if (upErr) throw upErr;
}

export async function updateMyProfileRole(next: Extract<UserRole, 'customer' | 'supplier'>): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase не настроен');
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !authData.user) throw new Error('Not signed in');

  const { data: row, error: selErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', authData.user.id)
    .maybeSingle();
  if (selErr) throw selErr;
  if (row?.role === 'admin') {
    throw new Error('Administrator role can only be changed in the database');
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role: next })
    .eq('id', authData.user.id);
  if (error) throw error;
}

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = getSupabase()!;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ProfileRow | null;
}

export async function devEmailSignIn(email: string, password: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase не настроен');
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export type AuthUserView = {
  id: string;
  phone: string | null;
  email: string | null;
  role: UserRole;
  displayName: string | null;
};
