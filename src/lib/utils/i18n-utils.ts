export function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatRelativeTime(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const diffTime = date.getTime() - new Date().getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return rtf.format(diffHours, 'hour');
  }
  
  return rtf.format(diffDays, 'day');
}