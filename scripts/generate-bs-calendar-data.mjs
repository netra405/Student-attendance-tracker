import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BSToAD } from 'datex-bs';

const MIN_YEAR = 1977;
const MAX_YEAR = 2200;

function getMonthLength(year, month) {
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

function generateData() {
  const years = {};
  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    years[String(year)] = Array.from({ length: 12 }, (_, i) =>
      getMonthLength(year, i + 1)
    );
  }
  return {
    source: 'datex-bs',
    generatedAt: new Date().toISOString(),
    minYear: MIN_YEAR,
    maxYear: MAX_YEAR,
    years,
  };
}

const data = generateData();
const outputDir = resolve(process.cwd(), 'data');
const outputPath = resolve(process.cwd(), 'data', 'bs-calendar-data.json');
mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
console.log(`Generated ${outputPath} with years ${data.minYear}-${data.maxYear}`);
