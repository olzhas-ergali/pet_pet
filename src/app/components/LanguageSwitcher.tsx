import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '@/i18n';
import { swapRouteLang } from '@/i18n/langRouting';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [pulse, setPulse] = useState(0);

  const current = (i18n.resolvedLanguage ?? 'ru').split('-')[0] as AppLanguage;

  useEffect(() => {
    setPulse((k) => k + 1);
  }, [i18n.language]);

  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <Globe className="w-4 h-4 shrink-0 text-gray-500 dark:text-zinc-400" aria-hidden />
      <span className="hidden sm:inline text-sm text-gray-600 dark:text-zinc-300">{t('language.label')}</span>
      <motion.div
        key={pulse}
        initial={{ opacity: 0.75, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        <select
          className="text-sm border border-gray-200 dark:border-zinc-600 rounded-xl px-3 py-2 bg-white dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          value={SUPPORTED_LANGUAGES.includes(current) ? current : 'ru'}
          onChange={(e) => {
            const lng = e.target.value as AppLanguage;
            void i18n.changeLanguage(lng);
            const next = swapRouteLang(location.pathname + location.search, lng);
            navigate(next, { replace: true });
          }}
          aria-label={t('language.label')}
        >
          <option value="kk">{t('language.kk')}</option>
          <option value="ru">{t('language.ru')}</option>
          <option value="en">{t('language.en')}</option>
        </select>
      </motion.div>
    </label>
  );
}
