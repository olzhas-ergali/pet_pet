/** BCP 47 для Intl (суммы, количество) по языку приложения */
export function intlLocaleForApp(lang: string): string {
  const base = lang.split('-')[0] ?? 'ru';
  if (base === 'kk') return 'kk-KZ';
  if (base === 'en') return 'en-US';
  return 'ru-KZ';
}

export function formatNumberAmount(value: number, lang: string): string {
  return value.toLocaleString(intlLocaleForApp(lang));
}
