import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart } from 'lucide-react';
import { RecentPurchase } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { getDateFnsLocale } from '@/i18n/dateLocale';

const mockPurchases: Omit<RecentPurchase, 'id' | 'timestamp'>[] = [
  { productName: 'Порошок стиральный Ariel', quantity: 15 },
  { productName: 'Масло подсолнечное', quantity: 20 },
  { productName: 'Туалетная бумага', quantity: 12 },
  { productName: 'Средство для посуды Fairy', quantity: 8 },
  { productName: 'Гречка ядрица', quantity: 30 },
];

const mockBuyers = ['Алина', 'Данияр', 'Марат', 'Елена', 'Олжас'];

/** Демо FOMO: случайные «покупки»; во вкладке в фоне не спамим показами */
export function RecentPurchases() {
  const { t, i18n } = useTranslation();
  const [fomo, setFomo] = useState<{
    purchase: RecentPurchase;
    buyer: string;
  } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showRandomPurchase = useCallback(() => {
    const randomPurchase = mockPurchases[Math.floor(Math.random() * mockPurchases.length)];
    const buyer = mockBuyers[Math.floor(Math.random() * mockBuyers.length)];
    const purchase: RecentPurchase = {
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : String(Math.random()),
      ...randomPurchase,
      timestamp: new Date(),
    };
    setFomo({ purchase, buyer });
    setIsVisible(true);
    setTimeout(() => setIsVisible(false), 4000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const schedule = () => {
      const delay = 10000 + Math.random() * 5000;
      timeoutRef.current = setTimeout(() => {
        if (cancelled) return;
        if (document.visibilityState === 'visible') {
          showRandomPurchase();
        }
        schedule();
      }, delay);
    };

    const first = setTimeout(() => {
      if (!cancelled) showRandomPurchase();
    }, 3000);
    schedule();

    return () => {
      cancelled = true;
      clearTimeout(first);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [showRandomPurchase]);

  const dateLocale = getDateFnsLocale(i18n.language);

  return (
    <AnimatePresence>
      {isVisible && fomo && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 left-4 z-40 bg-white shadow-2xl rounded-2xl p-4 max-w-sm border border-gray-100 pointer-events-none"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl p-2.5 shadow-lg shadow-emerald-500/30">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                {t('fomo.title')}
              </div>
              <div className="font-semibold text-gray-900 mb-1 line-clamp-3">
                {t('fomo.recent_purchase', {
                  user: fomo.buyer,
                  quantity: fomo.purchase.quantity,
                  pcs: t('fomo.pcs'),
                  product: fomo.purchase.productName,
                })}
              </div>
              <div className="text-xs text-gray-400">
                {formatDistanceToNow(fomo.purchase.timestamp, {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
