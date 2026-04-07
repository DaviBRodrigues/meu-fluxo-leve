import { isToday, isYesterday, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function formatCurrency(value: number, masked?: boolean): string {
  if (masked) return 'R$ •••••';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Parse a date string (YYYY-MM-DD) as a LOCAL date, not UTC.
 * new Date('2026-03-02') is parsed as UTC midnight, which becomes
 * the previous day in negative UTC offsets (e.g. Brazil UTC-3).
 */
export function parseLocalDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  // If it's a YYYY-MM-DD string, parse as local
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(date);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(parseLocalDate(date));
}

export function formatRelativeDate(date: string | Date): string {
  const dateObj = parseLocalDate(date);
  
  if (isToday(dateObj)) {
    return 'Hoje';
  }
  
  if (isYesterday(dateObj)) {
    return 'Ontem';
  }
  
  return format(dateObj, "d 'de' MMMM", { locale: ptBR });
}

export function formatShortDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(parseLocalDate(date));
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1);
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
}

export function parseNumber(value: string): number {
  // Handle Brazilian number format (1.234,56)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized) || 0;
}
