import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Filter } from 'lucide-react';

type ShowcaseItem = {
  to: string;
  title: string;
  hint: string;
  image: string;
};

/** Примеры групп товаров с фото — ссылки в каталог с отбором (категория или поиск). */
export function ProfileCatalogShowcase() {
  const { t } = useTranslation();

  const items: ShowcaseItem[] = useMemo(() => {
    const bev = encodeURIComponent(t('profile.showcase.searchBeverages'));
    const pack = encodeURIComponent(t('profile.showcase.searchPackaging'));
    return [
      {
        to: '/catalog?cat=food',
        title: t('catalog.category.food'),
        hint: t('profile.showcase.hintCategory'),
        image:
          'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=640&q=80&auto=format&fit=crop',
      },
      {
        to: '/catalog?cat=home_chemistry',
        title: t('catalog.category.home_chemistry'),
        hint: t('profile.showcase.hintCategory'),
        image:
          'https://images.unsplash.com/photo-1584622650111-993a426bbf3f?w=640&q=80&auto=format&fit=crop',
      },
      {
        to: `/catalog?q=${bev}`,
        title: t('profile.showcase.demoBeveragesTitle'),
        hint: t('profile.showcase.hintSearch'),
        image:
          'https://images.unsplash.com/photo-1544145945-a9c6a9d29fab?w=640&q=80&auto=format&fit=crop',
      },
      {
        to: `/catalog?q=${pack}`,
        title: t('profile.showcase.demoPackagingTitle'),
        hint: t('profile.showcase.hintSearch'),
        image:
          'https://images.unsplash.com/photo-1603914580074-57b70408f832?w=640&q=80&auto=format&fit=crop',
      },
    ];
  }, [t]);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 shrink-0">
          <Filter className="w-5 h-5" aria-hidden />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-zinc-100">{t('profile.showcase.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1 leading-relaxed">{t('profile.showcase.subtitle')}</p>
        </div>
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 pt-2">
        {items.map((item) => (
          <li key={item.to}>
            <Link
              to={item.to}
              className="group flex flex-col rounded-xl border border-gray-100 dark:border-zinc-700 overflow-hidden bg-gray-50/80 dark:bg-zinc-800/80 hover:border-emerald-200 dark:hover:border-emerald-600/40 hover:shadow-md hover:shadow-emerald-500/10 transition-all"
            >
              <div className="aspect-[16/10] overflow-hidden bg-gray-200">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div className="p-3 space-y-1">
                <p className="font-medium text-gray-900 dark:text-zinc-100 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 leading-snug">{item.hint}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
