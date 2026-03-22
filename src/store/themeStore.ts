import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UiTheme = 'light' | 'dark';

type ThemeState = {
  theme: UiTheme;
  setTheme: (theme: UiTheme) => void;
  toggleTheme: () => void;
};

/** Синхронизация с Tailwind `dark:` (класс на `document.documentElement`). */
export function applyThemeToDocument(theme: UiTheme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'optbirja-ui-theme' },
  ),
);
