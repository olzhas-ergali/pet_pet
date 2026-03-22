import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useProductStore } from '@/store/productStore';

/** Предупреждение при сбое канала Realtime цен (без ложных срабатываний при CLOSED при размонтировании) */
export function RealtimeStatusBanner() {
  const { t } = useTranslation();
  const status = useRealtimeStore((s) => s.pricesChannel);
  const setPricesChannel = useRealtimeStore((s) => s.setPricesChannel);
  const load = useProductStore((s) => s.load);

  if (status !== 'error') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="overflow-hidden border-b border-amber-200 bg-amber-50 text-amber-950"
      >
        <div className="flex flex-wrap items-center justify-center gap-3 px-3 py-2 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
            {t('realtime.disconnected')}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-amber-900 shadow-sm ring-1 ring-amber-200 transition hover:bg-amber-100"
            onClick={() => {
              setPricesChannel('idle');
              void load();
            }}
          >
            <RefreshCw className="w-4 h-4" />
            {t('realtime.retrySync')}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
