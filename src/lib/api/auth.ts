import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { ProfileRow, UserRole } from '@/types/database';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.startsWith('7') && digits.length === 11) {
    return `+${digits}`;
  }
  if (raw.trim().startsWith('+')) return raw.trim();
  return `+${digits}`;
}

export async function sendPhoneOtp(phone: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase не настроен');
  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizePhone(phone),
    options: { shouldCreateUser: true },
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
