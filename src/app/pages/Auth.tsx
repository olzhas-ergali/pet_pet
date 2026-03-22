import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Package } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  applySignupRoleFromStorage,
  devEmailSignIn,
  PREFER_SUPPLIER_PORTAL_KEY,
  sendPhoneOtp,
  SIGNUP_ROLE_STORAGE_KEY,
  verifyPhoneOtp,
  type SignupAccountType,
} from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { getPostLoginDestination } from '@/lib/auth/navigation';
import { mapRpcUserMessage } from '@/lib/api/orderErrors';
import { SessionSplash } from '../components/SessionSplash';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { isAuthMockEnabled } from '@/lib/auth/mockSession';
import {
  extractRuNationalDigits,
  formatRuNationalDisplay,
  ruE164FromNational,
} from '@/lib/phone/ruMobile';
import { useRouteLang } from '@/hooks/useLocalizedPath';

const devEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL;
const devPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
/** В development форма видна всегда (с подставленными тестовыми значениями); в prod — только если заданы оба ключа в .env */
const showDevLogin = import.meta.env.DEV || Boolean(devEmail && devPassword);

export function Auth() {
  const { t } = useTranslation();
  /** Национальная часть РФ без +7/8: 10 цифр, обычно 9XX… */
  const [phoneNational, setPhoneNational] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [devE, setDevE] = useState(
    () => devEmail || (import.meta.env.DEV ? 'demo@optbirja.local' : '')
  );
  const [devP, setDevP] = useState(
    () => devPassword || (import.meta.env.DEV ? 'demo123456' : '')
  );
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const routeLang = useRouteLang();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const loginMockDemo = useAuthStore((s) => s.loginMockDemo);
  const [accountType, setAccountType] = useState<SignupAccountType>('customer');

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'supplier') setAccountType('supplier');
    else if (r === 'customer') setAccountType('customer');
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    if (!isSupabaseConfigured && !isAuthMockEnabled()) return;
    const preferSupplier =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(PREFER_SUPPLIER_PORTAL_KEY) === '1';
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(PREFER_SUPPLIER_PORTAL_KEY);
    }
    let dest = getPostLoginDestination(fromPath, routeLang);
    if (preferSupplier && user.role === 'supplier') {
      dest = `/${routeLang}/supplier`;
    }
    navigate(dest, { replace: true });
  }, [ready, user, fromPath, navigate, routeLang]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error(t('auth.toastNoEnv'));
      return;
    }
    const phoneE164 = ruE164FromNational(phoneNational);
    if (!phoneE164) {
      toast.error(t('auth.toastPhoneIncomplete'));
      return;
    }
    setLoading(true);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, accountType);
      }
      await sendPhoneOtp(phoneE164, { accountType });
      setOtp('');
      setStep('otp');
      toast.success(t('auth.toastCodeSent'));
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneE164 = ruE164FromNational(phoneNational);
    if (!phoneE164) {
      toast.error(t('auth.toastPhoneIncomplete'));
      setOtp('');
      setStep('phone');
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(phoneE164, otp);
      await applySignupRoleFromStorage();
      if (accountType === 'supplier' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PREFER_SUPPLIER_PORTAL_KEY, '1');
      }
      await refreshProfile();
      toast.success(t('auth.toastWelcome'));
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) return;
    setLoading(true);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, accountType);
      }
      await devEmailSignIn(devE, devP);
      await applySignupRoleFromStorage();
      if (accountType === 'supplier' && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(PREFER_SUPPLIER_PORTAL_KEY, '1');
      }
      await refreshProfile();
      toast.success(t('auth.toastDevOk'));
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleMockDemo = () => {
    if (accountType === 'supplier') {
      toast.info(t('auth.mockSupplierBody'));
    }
    loginMockDemo();
    toast.success(t('auth.toastDemoMock'));
  };

  if (!ready && isSupabaseConfigured) {
    return <SessionSplash />;
  }

  if (ready && user && (isSupabaseConfigured || isAuthMockEnabled())) {
    return <SessionSplash />;
  }

  const stepPill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold tracking-wide transition-colors ${
      active
        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25'
        : 'bg-stone-100 text-stone-500 dark:bg-white/5 dark:text-stone-500'
    }`;

  return (
    <div
      className="relative min-h-screen flex flex-col px-4 pb-12 text-stone-900 dark:text-stone-100 overflow-hidden"
      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 right-0 h-[420px] w-[420px] rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-[380px] w-[380px] rounded-full bg-amber-400/12 dark:bg-amber-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(0,0,0,0.03),_transparent_50%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.05),_transparent_50%)]" />
      </div>

      <div className="relative z-10 flex justify-end pt-4 pb-2">
        <div className="rounded-full border border-stone-200/90 dark:border-white/10 bg-white/80 dark:bg-zinc-950/70 px-2 py-1 shadow-sm backdrop-blur-xl">
          <LanguageSwitcher className="[&_span]:text-stone-600 dark:[&_span]:text-stone-400 [&_select]:bg-white dark:[&_select]:bg-stone-900 [&_select]:text-stone-900 dark:[&_select]:text-stone-100 [&_select]:border-stone-200 dark:[&_select]:border-white/20 [&_svg]:text-stone-500 dark:[&_svg]:text-stone-400" />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center pt-2 pb-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[440px]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/25">
              <Package className="h-6 w-6" strokeWidth={2} aria-hidden />
            </div>
            <h1
              className="text-[2rem] sm:text-4xl font-medium tracking-tight text-stone-900 dark:text-white"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('auth.pageTitle')}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-stone-600 dark:text-stone-400 leading-relaxed max-w-sm mx-auto">
              {t('auth.pageSubtitle')}
            </p>
            <Link
              to={`/${routeLang}`}
              className="mt-4 inline-block text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 underline-offset-4 hover:underline"
            >
              {t('auth.backToLanding')}
            </Link>
          </div>

          <div className="mb-5 flex items-center justify-center gap-2">
            <span className={stepPill(step === 'phone')} aria-current={step === 'phone' ? 'step' : undefined}>
              {t('auth.stepPhone')}
            </span>
            <span className="h-px w-6 bg-stone-200 dark:bg-white/15" aria-hidden />
            <span className={stepPill(step === 'otp')} aria-current={step === 'otp' ? 'step' : undefined}>
              {t('auth.stepOtp')}
            </span>
          </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="rounded-[1.75rem] border border-stone-200/90 dark:border-white/10 bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl p-7 sm:p-8 space-y-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.45)]"
        >
          {!isSupabaseConfigured && (
            <div className="text-sm text-amber-950 dark:text-amber-100 bg-amber-50/95 dark:bg-amber-500/12 border border-amber-200/90 dark:border-amber-500/25 rounded-xl p-4 space-y-2">
              <p className="font-medium">{t('auth.noEnv')}</p>
              <p className="text-xs leading-relaxed opacity-90">{t('auth.noEnvBff')}</p>
            </div>
          )}

          {!isSupabaseConfigured && isAuthMockEnabled() && (
            <div className="space-y-3 pb-5 border-b border-stone-200/80 dark:border-white/10">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wide">{t('auth.demoUiTitle')}</p>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">{t('auth.demoUiHint')}</p>
              <button
                type="button"
                onClick={handleMockDemo}
                className="w-full py-3.5 rounded-xl bg-amber-100/90 dark:bg-amber-500/18 border border-amber-200 dark:border-amber-500/35 text-amber-950 dark:text-amber-50 font-semibold hover:bg-amber-200/80 dark:hover:bg-amber-500/28 transition-colors"
              >
                {t('auth.demoUiButton')}
              </button>
            </div>
          )}

          {showDevLogin && (
            <form onSubmit={handleDevLogin} className="space-y-3 pb-5 border-b border-stone-200/80 dark:border-white/10">
              <div>
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{t('auth.devBlockTitle')}</p>
                <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-500 leading-relaxed">{t('auth.devLogin')}</p>
              </div>
              {import.meta.env.DEV && (
                <p className="text-xs text-stone-500 dark:text-stone-500 leading-relaxed rounded-xl bg-stone-50 dark:bg-white/[0.04] border border-stone-100 dark:border-white/10 px-3 py-2">
                  {t('auth.devLoginHint')}
                </p>
              )}
              <input
                type="email"
                value={devE}
                onChange={(e) => setDevE(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-stone-50/90 dark:bg-black/30 border border-stone-200 dark:border-white/12 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-500/55 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-shadow"
                placeholder="Email"
                autoComplete="email"
              />
              <input
                type="password"
                value={devP}
                onChange={(e) => setDevP(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-stone-50/90 dark:bg-black/30 border border-stone-200 dark:border-white/12 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:border-emerald-500/55 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-shadow"
                placeholder={t('auth.passwordPlaceholder')}
                autoComplete="current-password"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-stone-800 dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                {t('auth.devLoginSubmit')}
              </button>
            </form>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  {t('auth.accountTypeLabel')}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`rounded-2xl border px-3 py-3.5 text-left transition-all ${
                      accountType === 'customer'
                        ? 'border-emerald-500/75 bg-emerald-50/95 dark:bg-emerald-500/14 ring-2 ring-emerald-500/25'
                        : 'border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-black/25 hover:border-stone-300 dark:hover:border-white/18'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {t('auth.accountBuyer')}
                    </span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                      {t('auth.accountBuyerHint')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('supplier')}
                    className={`rounded-2xl border px-3 py-3.5 text-left transition-all ${
                      accountType === 'supplier'
                        ? 'border-amber-500/75 bg-amber-50/95 dark:bg-amber-500/14 ring-2 ring-amber-500/25'
                        : 'border-stone-200 dark:border-white/10 bg-stone-50/80 dark:bg-black/25 hover:border-stone-300 dark:hover:border-white/18'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
                      {t('auth.accountSeller')}
                    </span>
                    <span className="block text-xs text-stone-500 dark:text-stone-400 mt-1 leading-snug">
                      {t('auth.accountSellerHint')}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-500 mt-2 leading-relaxed">{t('auth.accountTypeFoot')}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  {t('auth.phone')}
                </label>
                <div className="flex rounded-2xl border border-stone-200 dark:border-white/12 bg-stone-50/90 dark:bg-black/30 overflow-hidden transition-shadow focus-within:border-emerald-500/55 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span
                    className="flex items-center px-4 bg-stone-100/90 dark:bg-stone-900/90 text-stone-500 dark:text-stone-400 border-r border-stone-200 dark:border-white/10 text-lg font-medium tabular-nums select-none shrink-0"
                    aria-hidden
                  >
                    +7
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formatRuNationalDisplay(phoneNational)}
                    onChange={(e) => setPhoneNational(extractRuNationalDigits(e.target.value))}
                    placeholder={t('auth.phoneNationalPlaceholder')}
                    aria-label={t('auth.phone')}
                    className="flex-1 min-w-0 px-4 py-4 bg-transparent focus:outline-none text-lg text-stone-900 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-base sm:text-lg hover:opacity-[0.97] transition-opacity shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  t('auth.sending')
                ) : (
                  <>
                    {t('auth.sendCode')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 text-center leading-relaxed px-1">
                {accountType === 'supplier' ? t('auth.otpAsSupplier') : t('auth.otpAsBuyer')}
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  {t('auth.otp')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={8}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full px-5 py-4 bg-stone-50/90 dark:bg-black/30 border border-stone-200 dark:border-white/12 rounded-2xl focus:border-emerald-500/55 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-shadow text-2xl tracking-[0.35em] text-center text-stone-900 dark:text-stone-100 placeholder:text-stone-300 dark:placeholder:text-stone-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    setStep('phone');
                  }}
                  className="text-sm text-emerald-700 dark:text-emerald-400 mt-3 hover:underline underline-offset-2"
                >
                  {t('auth.changePhone')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-base sm:text-lg hover:opacity-[0.97] transition-opacity shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  t('auth.checking')
                ) : (
                  <>
                    {t('auth.login')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>

        <p className="text-center text-sm text-stone-500 dark:text-stone-500 mt-8 max-w-sm mx-auto leading-relaxed">
          {t('auth.terms')}
        </p>
        {import.meta.env.DEV && (
          <p className="text-center text-xs text-stone-400 dark:text-stone-600 mt-4 max-w-sm mx-auto leading-relaxed">
            {t('auth.devFullStack')}
          </p>
        )}
      </motion.div>
      </div>
    </div>
  );
}
