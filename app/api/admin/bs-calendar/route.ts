import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { generateBSCalendarData, type BSCalendarData } from '@/lib/bsCalendarGenerator';

const DATA_FILE = join(process.cwd(), 'data', 'bs-calendar-data.json');

function validateMonthLengths(lengths: unknown): lengths is number[] {
  return (
    Array.isArray(lengths) &&
    lengths.length === 12 &&
    lengths.every((n) => Number.isInteger(n) && n >= 28 && n <= 32)
  );
}

async function readCalendarData(): Promise<BSCalendarData> {
  const raw = await readFile(DATA_FILE, 'utf8');
  return JSON.parse(raw) as BSCalendarData;
}

async function saveCalendarData(data: BSCalendarData) {
  await mkdir(join(process.cwd(), 'data'), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await readCalendarData();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load calendar data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action as string | undefined;

    if (action === 'regenerate') {
      const minYear = Number(body?.minYear) || 1977;
      const maxYear = Number(body?.maxYear) || 2200;
      if (minYear > maxYear) {
        return NextResponse.json(
          { error: 'minYear must be less than or equal to maxYear' },
          { status: 400 }
        );
      }

      const data = generateBSCalendarData(minYear, maxYear);
      await saveCalendarData(data);
      return NextResponse.json({
        message: 'Calendar dataset regenerated successfully',
        minYear: data.minYear,
        maxYear: data.maxYear,
      });
    }

    if (action === 'update-year') {
      const year = Number(body?.year);
      const monthLengths = body?.monthLengths;
      if (!Number.isInteger(year)) {
        return NextResponse.json({ error: 'Valid year is required' }, { status: 400 });
      }
      if (!validateMonthLengths(monthLengths)) {
        return NextResponse.json(
          { error: 'monthLengths must be an array of 12 integers between 28 and 32' },
          { status: 400 }
        );
      }

      const data = await readCalendarData();
      data.years[String(year)] = monthLengths;
      data.generatedAt = new Date().toISOString();
      data.minYear = Math.min(data.minYear, year);
      data.maxYear = Math.max(data.maxYear, year);
      await saveCalendarData(data);

      return NextResponse.json({
        message: `Updated BS year ${year} successfully`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update calendar data' },
      { status: 500 }
    );
  }
}

