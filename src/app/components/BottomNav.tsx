import { Home, Search, ShoppingCart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useCartStore, selectCartCount } from '@/store/cartStore';

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const cartCount = useCartStore(selectCartCount);

  const navItems: {
    icon: typeof Home;
    label: string;
    path: string;
    match?: (pathname: string) => boolean;
    badge?: number;
  }[] = [
    { icon: Home, label: t('nav.home'), path: '/market' },
    {
      icon: Search,
      label: t('nav.catalog'),
      path: '/catalog',
      match: (p) => p === '/catalog' || p.startsWith('/product/'),
    },
    { icon: ShoppingCart, label: t('nav.cart'), path: '/cart', badge: cartCount },
    {
      icon: User,
      label: t('nav.profile'),
      path: '/profile',
      match: (p) => p === '/profile' || p.startsWith('/profile/'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-40 md:hidden">
      <div className="flex items-center justify-around py-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match
            ? item.match(location.pathname)
            : location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
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
