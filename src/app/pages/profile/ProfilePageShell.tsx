import { Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';
import { BottomNav } from '../../components/BottomNav';

type Props = {
  title: string;
  children: React.ReactNode;
};

export function ProfilePageShell({ title, children }: Props) {
  const { t } = useTranslation();
  const p = useLocalizedPath();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-20">
      <header className="bg-white dark:bg-zinc-900 sticky top-0 z-30 shadow-sm border-b border-gray-100 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4 max-w-lg">
          <Link
            to={p('/profile')}
            className="inline-flex items-center gap-2 text-emerald-600 font-medium text-sm hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            {t('profile.backToProfile')}
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">{title}</h1>
        </div>
      </header>
      <div className="container mx-auto px-4 py-6 max-w-lg text-gray-900 dark:text-zinc-100">{children}</div>
      <BottomNav />
    </div>
  );
}
