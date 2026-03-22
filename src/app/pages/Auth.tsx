import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { sendPhoneOtp, verifyPhoneOtp, devEmailSignIn } from '@/lib/api/auth';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { getPostLoginDestination } from '@/lib/auth/navigation';
import { mapRpcUserMessage } from '@/lib/api/orderErrors';
import { SessionSplash } from '../components/SessionSplash';

const devEmail = import.meta.env.VITE_DEV_LOGIN_EMAIL;
const devPassword = import.meta.env.VITE_DEV_LOGIN_PASSWORD;
const showDevLogin = Boolean(devEmail && devPassword);

export function Auth() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [devE, setDevE] = useState(devEmail ?? '');
  const [devP, setDevP] = useState(devPassword ?? '');
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);

  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  useEffect(() => {
    if (!ready || !isSupabaseConfigured) return;
    if (!user) return;
    const dest = getPostLoginDestination(fromPath);
    navigate(dest, { replace: true });
  }, [ready, user, fromPath, navigate]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      toast.error(t('auth.toastNoEnv'));
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(phone);
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
    setLoading(true);
    try {
      await verifyPhoneOtp(phone, otp);
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
      await devEmailSignIn(devE, devP);
      toast.success(t('auth.toastDevOk'));
    } catch (err) {
      toast.error(mapRpcUserMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!ready && isSupabaseConfigured) {
    return <SessionSplash />;
  }

  if (ready && user && isSupabaseConfigured) {
    return <SessionSplash />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-12 relative">
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
          <p className="text-stone-300 text-lg mb-4">{t('auth.tagline')}</p>
          <Link
            to="/"
            className="text-sm text-amber-400/90 hover:text-amber-300 transition-colors"
          >
            {t('auth.backToLanding')}
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-stone-900/85 border border-white/10 backdrop-blur-md rounded-3xl p-8 space-y-6 shadow-2xl shadow-black/40"
        >
          {!isSupabaseConfigured && (
            <p className="text-sm text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-xl p-3">
              {t('auth.noEnv')}
            </p>
          )}

          {showDevLogin && (
            <form onSubmit={handleDevLogin} className="space-y-3 pb-4 border-b border-white/10">
              <p className="text-xs font-semibold text-stone-400 uppercase">{t('auth.devLogin')}</p>
              <input
                type="email"
                value={devE}
                onChange={(e) => setDevE(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-white/15 text-stone-100 placeholder:text-stone-500 focus:border-amber-500/50 focus:outline-none"
                placeholder="Email"
              />
              <input
                type="password"
                value={devP}
                onChange={(e) => setDevP(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-white/15 text-stone-100 placeholder:text-stone-500 focus:border-amber-500/50 focus:outline-none"
                placeholder={t('auth.passwordPlaceholder')}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-stone-100 text-stone-900 font-semibold hover:bg-white disabled:opacity-50 transition-colors"
              >
                {t('auth.devLoginSubmit')}
              </button>
            </form>
          )}

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-300 mb-3">
                  {t('auth.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-5 py-4 bg-stone-950 border border-white/15 rounded-2xl focus:border-emerald-500/60 focus:outline-none transition-all text-lg text-stone-100 placeholder:text-stone-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isSupabaseConfigured}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 py-4 rounded-2xl font-semibold text-lg hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
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
              <div className="mb-6">
                <label className="block text-sm font-semibold text-stone-300 mb-3">
                  {t('auth.otp')}
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="• • • • • •"
                  maxLength={8}
                  className="w-full px-5 py-4 bg-stone-950 border border-white/15 rounded-2xl focus:border-emerald-500/60 focus:outline-none transition-all text-2xl tracking-widest text-center text-stone-100 placeholder:text-stone-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-stone-400 mt-3 hover:text-stone-200"
                >
                  {t('auth.changePhone')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 py-4 rounded-2xl font-semibold text-lg hover:opacity-95 transition-opacity shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
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

        <p className="text-center text-sm text-stone-500 mt-8 max-w-sm mx-auto leading-relaxed">
          {t('auth.terms')}
        </p>
      </motion.div>
    </div>
  );
}
