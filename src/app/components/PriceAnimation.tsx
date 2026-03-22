import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumberAmount } from '@/i18n/format';

interface PriceAnimationProps {
  value: number;
  previousValue?: number;
  className?: string;
  showChange?: boolean;
}

export function PriceAnimation({
  value,
  previousValue,
  className = '',
  showChange = true,
}: PriceAnimationProps) {
  const { i18n, t } = useTranslation();
  const [flash, setFlash] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (previousValue && previousValue !== value) {
      setDirection(value > previousValue ? 'up' : 'down');
      setFlash(true);
      const timer = setTimeout(() => {
        setFlash(false);
        setDirection(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [value, previousValue]);

  return (
    <div className="relative inline-block">
      <motion.span
        key={value}
        initial={{ opacity: 0, y: direction === 'down' ? -10 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${className} ${
          flash
            ? direction === 'down'
              ? 'text-emerald-600'
              : 'text-red-600'
            : ''
        } transition-colors duration-500`}
      >
        {formatNumberAmount(value, i18n.language)} {t('common.currency')}
      </motion.span>

      <AnimatePresence>
        {showChange && flash && previousValue && (
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -20, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            className={`absolute -top-6 left-0 text-xs font-semibold ${
              direction === 'down' ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {direction === 'down' ? '↓' : '↑'}{' '}
            {formatNumberAmount(Math.abs(value - previousValue), i18n.language)} {t('common.currency')}
          </motion.div>
        )}
      </AnimatePresence>

      {flash && (
        <motion.div
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className={`absolute inset-0 rounded-lg ${
            direction === 'down' ? 'bg-emerald-400' : 'bg-red-400'
          }`}
        />
      )}
    </div>
  );
}
