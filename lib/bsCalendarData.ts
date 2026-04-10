import bsCalendarRaw from '@/data/bs-calendar-data.json';

type BSCalendarData = {
  source: string;
  generatedAt: string;
  minYear: number;
  maxYear: number;
  years: Record<string, number[]>;
};

const bsCalendarData = bsCalendarRaw as BSCalendarData;

export const BS_MIN_YEAR = bsCalendarData.minYear;
export const BS_MAX_YEAR = bsCalendarData.maxYear;

export function getBsMonthLength(year: number, month: number): number | null {
  const months = bsCalendarData.years[String(year)];
  if (!months || month < 1 || month > 12) return null;
  const length = months[month - 1];
  if (!Number.isInteger(length) || length < 28 || length > 32) return null;
  return length;
}

export function hasBsYear(year: number): boolean {
  return Boolean(bsCalendarData.years[String(year)]);
}
