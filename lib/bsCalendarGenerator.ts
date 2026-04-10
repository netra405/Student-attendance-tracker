import { BSToAD } from 'datex-bs';

export const DEFAULT_BS_MIN_YEAR = 1977;
export const DEFAULT_BS_MAX_YEAR = 2200;

export type BSCalendarData = {
  source: string;
  generatedAt: string;
  minYear: number;
  maxYear: number;
  years: Record<string, number[]>;
};

function getMonthLength(year: number, month: number): number {
  let length = 0;
  for (let day = 1; day <= 32; day++) {
    const bs = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      BSToAD(bs);
      length = day;
    } catch {
      break;
    }
  }

  if (length === 0) {
    throw new Error(`Unable to detect BS month length for ${year}-${month}`);
  }

  return length;
}

export function generateBSCalendarData(
  minYear = DEFAULT_BS_MIN_YEAR,
  maxYear = DEFAULT_BS_MAX_YEAR
): BSCalendarData {
  const years: Record<string, number[]> = {};

  for (let year = minYear; year <= maxYear; year++) {
    years[String(year)] = Array.from({ length: 12 }, (_, i) =>
      getMonthLength(year, i + 1)
    );
  }

  return {
    source: 'datex-bs',
    generatedAt: new Date().toISOString(),
    minYear,
    maxYear,
    years,
  };
}

