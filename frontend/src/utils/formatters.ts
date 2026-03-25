import { format, parseISO } from 'date-fns';

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '--';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '--';
  try {
    return format(parseISO(value), 'MMM dd, yyyy');
  } catch {
    return '--';
  }
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  try {
    return format(parseISO(value), 'MMM dd, yyyy HH:mm');
  } catch {
    return '--';
  }
}

export function formatRR(value: number | null | undefined): string {
  if (value == null) return '--';
  return `${value.toFixed(2)}R`;
}

export function formatPnl(value: number | null | undefined): { text: string; className: string } {
  if (value == null) return { text: '--', className: '' };

  const prefix = value >= 0 ? '+' : '';
  const text = `${prefix}${formatCurrency(value).replace('$', '$')}`;

  let className = '';
  if (value > 0) className = 'text-green';
  else if (value < 0) className = 'text-red';
  else className = 'text-yellow';

  return { text, className };
}
