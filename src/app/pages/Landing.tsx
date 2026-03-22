import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { motion } from 'motion/react';
import { ArrowRight, Sparkles, Radio, Package, ShieldCheck, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { CATEGORY_ID_TO_DB } from '@/lib/catalogCategories';

export function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const authReady = useAuthStore((s) => s.ready);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (authReady && user) navigate('/market', { replace: true });
  }, [authReady, user, navigate]);

  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerNote, setPartnerNote] = useState('');

  const handlePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) {
      toast.error(t('landing.formNeedEmail'));
      return;
    }
    toast.success(t('landing.formThanks'));
    setPartnerEmail('');
    setPartnerNote('');
  };

  const categories = Object.keys(CATEGORY_ID_TO_DB).map((id) => ({
    id,
    label: t(`catalog.category.${id}`),
  }));

  return (
    <div
      className="min-h-screen selection:bg-amber-500/30"
      style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-[480px] w-[480px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 -left-32 h-[420px] w-[420px] rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_55%)]" />
      </div>

      <header className="relative z-10 border-b border-white/5">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">{t('landing.brand')}</p>
              <p className="text-sm font-medium text-stone-200">{t('landing.brandSub')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/auth"
              className="text-sm text-stone-400 hover:text-white transition-colors px-3 py-2"
            >
              {t('landing.signIn')}
            </Link>
            <Link
              to="/catalog"
              className="text-sm font-semibold rounded-full bg-white text-stone-900 px-4 py-2.5 hover:bg-stone-100 transition-colors shadow-lg shadow-black/20"
            >
              {t('landing.toCatalog')}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <p className="inline-flex items-center gap-2 text-amber-400/90 text-sm font-medium mb-6">
              <Radio className="w-4 h-4" aria-hidden />
              {t('landing.liveBadge')}
            </p>
            <h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white leading-[1.05] font-medium tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('landing.heroTitle')}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-stone-400 max-w-2xl leading-relaxed font-light">
              {t('landing.heroSubtitle')}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 text-stone-950 font-semibold px-8 py-4 text-lg hover:opacity-95 transition-opacity shadow-xl shadow-emerald-500/25"
              >
                {t('landing.ctaPrimary')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#partner"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 text-stone-200 px-8 py-4 text-lg hover:bg-white/5 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
                {t('landing.ctaSecondary')}
              </a>
            </div>
          </motion.div>
        </section>

        <section className="border-y border-white/5 bg-black/20">
          <div className="container mx-auto px-4 py-16 md:py-20">
            <div className="grid md:grid-cols-3 gap-10 md:gap-8">
              {[
                { icon: Radio, titleKey: 'landing.benefit1Title', bodyKey: 'landing.benefit1Body' },
                { icon: Package, titleKey: 'landing.benefit2Title', bodyKey: 'landing.benefit2Body' },
                { icon: ShieldCheck, titleKey: 'landing.benefit3Title', bodyKey: 'landing.benefit3Body' },
              ].map(({ icon: Icon, titleKey, bodyKey }, i) => (
                <motion.div
                  key={titleKey}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-amber-500/20 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{t(titleKey)}</h3>
                  <p className="text-stone-400 leading-relaxed font-light">{t(bodyKey)}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2
                className="text-3xl md:text-4xl text-white font-medium"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {t('landing.fomoTitle')}
              </h2>
              <p className="mt-4 text-stone-400 text-lg font-light leading-relaxed">{t('landing.fomoBody')}</p>
              <ul className="mt-8 space-y-4">
                <li className="flex gap-3 text-stone-300">
                  <Truck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.fomoBullet1')}</span>
                </li>
                <li className="flex gap-3 text-stone-300">
                  <Package className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.fomoBullet2')}</span>
                </li>
              </ul>
            </div>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-8 md:p-10">
              <p className="text-amber-400/90 text-sm font-medium uppercase tracking-wider mb-4">
                {t('landing.categoriesTitle')}
              </p>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <span
                    key={c.id}
                    className="px-4 py-2 rounded-full border border-white/10 text-stone-300 text-sm bg-black/20"
                  >
                    {c.label}
                  </span>
                ))}
              </div>
              <p className="mt-8 text-stone-500 text-sm leading-relaxed">{t('landing.categoriesHint')}</p>
            </div>
          </div>
        </section>

        <section id="partner" className="border-t border-white/5 bg-black/30 scroll-mt-20">
          <div className="container mx-auto px-4 py-16 md:py-24 max-w-xl">
            <h2
              className="text-3xl md:text-4xl text-white font-medium text-center"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {t('landing.partnerTitle')}
            </h2>
            <p className="mt-3 text-stone-400 text-center font-light">{t('landing.partnerSubtitle')}</p>
            <form onSubmit={handlePartner} className="mt-10 space-y-4">
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder={t('landing.formEmail')}
                className="w-full rounded-2xl bg-stone-900/80 border border-white/10 px-5 py-4 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
              <textarea
                value={partnerNote}
                onChange={(e) => setPartnerNote(e.target.value)}
                rows={3}
                placeholder={t('landing.formNote')}
                className="w-full rounded-2xl bg-stone-900/80 border border-white/10 px-5 py-4 text-white placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              />
              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-semibold py-4 text-lg hover:opacity-95 transition-opacity"
              >
                {t('landing.formSubmit')}
              </button>
              <p className="text-xs text-stone-600 text-center">{t('landing.formDisclaimer')}</p>
            </form>
          </div>
        </section>

        <footer className="border-t border-white/10 py-12">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-stone-500">
            <p>{t('landing.footerCopy')}</p>
            <div className="flex flex-wrap gap-6 justify-center">
              <a href="#" className="hover:text-stone-300 transition-colors">
                {t('landing.footerTelegram')}
              </a>
              <a href="#" className="hover:text-stone-300 transition-colors">
                {t('landing.footerLinkedIn')}
              </a>
              <a href="mailto:hello@optbirja.local" className="hover:text-stone-300 transition-colors">
                {t('landing.footerEmail')}
              </a>
            </div>
            <Link to="/market" className="text-amber-500/90 hover:text-amber-400 transition-colors">
              {t('landing.footerMarket')}
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
