import { useMemo } from 'react';
import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCartStore, selectCartCount } from '@/store/cartStore';
import { stripLangFromPath } from '@/i18n/langRouting';
import { useLocalizedPath } from '@/hooks/useLocalizedPath';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const p = useLocalizedPath();
  const cartCount = useCartStore(selectCartCount);
  const basePath = stripLangFromPath(location.pathname);

  const navItems: {
    icon: typeof Home;
    label: string;
    to: string;
    match?: (logicalPath: string) => boolean;
    badge?: number;
  }[] = useMemo(
    () => [
      { icon: Home, label: t('nav.home'), to: p('/market') },
      {
        icon: Search,
        label: t('nav.catalog'),
        to: p('/catalog'),
        match: (bp) => bp === '/catalog' || bp.startsWith('/product/'),
      },
      { icon: ShoppingCart, label: t('nav.cart'), to: p('/cart'), badge: cartCount },
      {
        icon: User,
        label: t('nav.profile'),
        to: p('/profile'),
        match: (bp) => bp === '/profile' || bp.startsWith('/profile/'),
      },
    ],
    [t, p, cartCount],
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-40 md:hidden">
      <div className="flex items-center justify-around py-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match
            ? item.match(basePath)
            : basePath === stripLangFromPath(item.to);

          return (
            <Link
              key={item.to}
              to={item.to}
              className={`relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-zinc-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-emerald-100' : ''}`} />
              {item.badge ? (
                <span className="absolute top-1 right-2 min-w-[1.1rem] h-4 px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              ) : null}
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
