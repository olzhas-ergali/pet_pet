import { useTranslation } from 'react-i18next';
import { Skeleton } from './ui/skeleton';

export function SessionSplash() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 gap-6">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-10 w-40 mx-auto rounded-lg" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
      <p className="text-sm text-gray-500">{t('session.loading')}</p>
    </div>
  );
}
