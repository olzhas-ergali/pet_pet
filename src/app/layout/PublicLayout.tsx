import { Outlet } from 'react-router';

/** Публичные страницы (лендинг, /auth). Переключатель языка — в шапке страниц, без fixed-оверлея. */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-stone-950 dark:text-stone-100">
      <Outlet />
    </div>
  );
}
