import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { buildCategoryOptions, type CategoryOption } from '@/lib/catalog/catalogFilters';

/** Стабильный список категорий для фильтров (пересчитывается при смене языка). */
export function useCategoryOptions(): CategoryOption[] {
  const { t } = useTranslation();
  return useMemo(() => buildCategoryOptions(t), [t]);
}
