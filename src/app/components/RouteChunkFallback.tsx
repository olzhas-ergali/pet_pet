import i18n from '@/i18n';

/** Пока подгружается чанк маршрута (code splitting). */
export function RouteChunkFallback() {
  return (
    <div
      className="min-h-[50vh] flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-zinc-400 px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-600 animate-spin" />
      <p className="text-sm">{i18n.t('common.loading')}</p>
    </div>
  );
}
