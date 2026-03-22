/** Российский мобильный: национальная часть 9XX XXX XX XX (10 цифр), страна +7 */

export function extractRuNationalDigits(input: string): string {
  let d = input.replace(/\D/g, '');
  if (d.startsWith('7')) d = d.slice(1);
  if (d.startsWith('8')) d = d.slice(1);
  return d.slice(0, 10);
}

/** Отображение только национальной части с маской */
export function formatRuNationalDisplay(nationalDigits: string): string {
  const d = nationalDigits.replace(/\D/g, '').slice(0, 10);
  if (!d) return '';
  let out = `(${d.slice(0, 3)}`;
  if (d.length <= 3) return d.length === 3 ? `${out}) ` : out;
  out += `) ${d.slice(3, 6)}`;
  if (d.length <= 6) return out;
  out += `-${d.slice(6, 8)}`;
  if (d.length <= 8) return out;
  return `${out}-${d.slice(8, 10)}`;
}

export function ruE164FromNational(national10: string): string {
  const d = national10.replace(/\D/g, '');
  if (d.length !== 10) return '';
  return `+7${d}`;
}
