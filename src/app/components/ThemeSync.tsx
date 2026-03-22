import { useEffect } from 'react';
import { applyThemeToDocument, useThemeStore } from '@/store/themeStore';

/** Подхватывает тему из zustand persist и выставляет класс на `<html>`. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);
  return null;
}
