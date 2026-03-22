import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ArrowRight } from 'lucide-react';
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

  return (
    <div className="min-h-screen flex flex-col px-4 pb-12">
      <div className="flex justify-end pt-4 pb-2">
        <div className="rounded-full border border-gray-200 dark:border-white/10 bg-white/90 dark:bg-black/30 px-2 py-1 shadow-sm dark:shadow-none backdrop-blur-md">
          <LanguageSwitcher className="[&_span]:text-gray-600 dark:[&_span]:text-stone-400 [&_select]:bg-white dark:[&_select]:bg-stone-900 [&_select]:text-gray-900 dark:[&_select]:text-stone-100 [&_select]:border-gray-200 dark:[&_select]:border-white/20 [&_svg]:text-gray-500 dark:[&_svg]:text-stone-400" />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-0 pt-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl mb-6 shadow-lg shadow-amber-500/25"
          >
            <TrendingUp className="w-10 h-10 text-stone-950" />
          </motion.div>
          <p className="text-gray-600 dark:text-stone-300 text-lg mb-4">{t('auth.tagline')}</p>
          <Link
            to={`/${routeLang}`}
            className="text-sm text-amber-600 dark:text-amber-400/90 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
          >
            {t('auth.backToLanding')}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-stone-900/90 border border-gray-200 dark:border-white/10 backdrop-blur-md rounded-3xl p-8 space-y-6 shadow-xl shadow-gray-200/80 dark:shadow-2xl dark:shadow-black/40"
        >
          {!isSupabaseConfigured && (
            <div className="text-sm text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 rounded-xl p-3 space-y-2">
              <p>{t('auth.noEnv')}</p>
              <p className="text-xs leading-relaxed opacity-95">{t('auth.noEnvBff')}</p>
            </div>
          )}

          {!isSupabaseConfigured && isAuthMockEnabled() && (
            <div className="space-y-3 pb-4 border-b border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400/90 uppercase">{t('auth.demoUiTitle')}</p>
              <p className="text-xs text-gray-600 dark:text-stone-400 leading-relaxed">{t('auth.demoUiHint')}</p>
              <button
                type="button"
                onClick={handleMockDemo}
                className="w-full py-3 rounded-xl bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 font-semibold hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
              >
                {t('auth.demoUiButton')}
              </button>
            </div>
          )}

          {showDevLogin && (
            <form onSubmit={handleDevLogin} className="space-y-3 pb-4 border-b border-gray-200 dark:border-white/10">
              <p className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase">{t('auth.devLogin')}</p>
              {import.meta.env.DEV && (
                <p className="text-xs text-gray-500 dark:text-stone-500 leading-relaxed">{t('auth.devLoginHint')}</p>
              )}
              <input
                type="email"
                value={devE}
                onChange={(e) => setDevE(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 focus:border-amber-500/50 focus:outline-none"
                placeholder="Email"
              />
              <input
                type="password"
                value={devP}
                onChange={(e) => setDevP(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500 focus:border-amber-500/50 focus:outline-none"
                placeholder={t('auth.passwordPlaceholder')}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gray-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 transition-colors"
              >
                {t('auth.devLoginSubmit')}
              </button>
            </form>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 dark:text-stone-400 uppercase tracking-wide mb-2">
                  {t('auth.accountTypeLabel')}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-1">
                  <button
                    type="button"
                    onClick={() => setAccountType('customer')}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                      accountType === 'customer'
                        ? 'border-emerald-500/70 bg-emerald-50/90 dark:bg-emerald-500/15 ring-1 ring-emerald-500/40'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-stone-950/50 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900 dark:text-stone-100">
                      {t('auth.accountBuyer')}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-stone-400 mt-1 leading-snug">
                      {t('auth.accountBuyerHint')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('supplier')}
                    className={`rounded-2xl border px-3 py-3 text-left transition-all ${
                      accountType === 'supplier'
                        ? 'border-amber-500/70 bg-amber-50/90 dark:bg-amber-500/15 ring-1 ring-amber-500/40'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-stone-950/50 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900 dark:text-stone-100">
                      {t('auth.accountSeller')}
                    </span>
                    <span className="block text-xs text-gray-500 dark:text-stone-400 mt-1 leading-snug">
                      {t('auth.accountSellerHint')}
                    </span>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-stone-500 mt-2 leading-relaxed">{t('auth.accountTypeFoot')}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-stone-300 mb-3">
                  {t('auth.phone')}
                </label>
                <div className="flex rounded-2xl border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-stone-950 overflow-hidden transition-colors focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/30">
                  <span
                    className="flex items-center px-4 bg-gray-100 dark:bg-stone-900/85 text-gray-500 dark:text-stone-400 border-r border-gray-200 dark:border-white/10 text-lg font-medium tabular-nums select-none shrink-0"
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
                    className="flex-1 min-w-0 px-4 py-4 bg-transparent focus:outline-none text-lg text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white py-4 rounded-2xl font-semibold text-lg hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
              <p className="text-xs text-gray-500 dark:text-stone-400 mb-4 text-center">
                {accountType === 'supplier' ? t('auth.otpAsSupplier') : t('auth.otpAsBuyer')}
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-stone-300 mb-3">
                  {t('auth.otp')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={8}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-stone-950 border border-gray-200 dark:border-white/15 rounded-2xl focus:border-emerald-500/60 focus:outline-none transition-all text-2xl tracking-widest text-center text-gray-900 dark:text-stone-100 placeholder:text-gray-400 dark:placeholder:text-stone-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    setOtp('');
                    setStep('phone');
                  }}
                  className="text-sm text-gray-500 dark:text-stone-400 mt-3 hover:text-gray-800 dark:hover:text-stone-200"
                >
                  {t('auth.changePhone')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-white py-4 rounded-2xl font-semibold text-lg hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
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

        <p className="text-center text-sm text-gray-500 dark:text-stone-500 mt-8 max-w-sm mx-auto leading-relaxed">
          {t('auth.terms')}
        </p>
        {import.meta.env.DEV && (
          <p className="text-center text-xs text-gray-400 dark:text-stone-600 mt-4 max-w-sm mx-auto leading-relaxed">
            {t('auth.devFullStack')}
          </p>
        )}
      </motion.div>
      </div>
    </div>
  );
}
