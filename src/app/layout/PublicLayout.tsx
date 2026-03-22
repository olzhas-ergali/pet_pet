import { Outlet } from 'react-router';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

/** Публичные страницы (лендинг) без обязательной авторизации */
export function PublicLayout() {
  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="fixed top-0 right-0 z-[70] p-3">
        <div className="rounded-full border border-white/10 bg-black/40 px-2 py-1 backdrop-blur-md">
          <LanguageSwitcher className="[&_span]:text-stone-300 [&_select]:bg-stone-900 [&_select]:text-stone-100 [&_select]:border-white/20 [&_svg]:text-stone-400" />
        </div>
      </div>
      <Outlet />
    </div>
  );
}
