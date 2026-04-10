import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { BSCalendarData } from '@/lib/bsCalendarGenerator';

const DATA_FILE = join(process.cwd(), 'data', 'bs-calendar-data.json');

export async function GET() {
  try {
    const raw = await readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw) as BSCalendarData;
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to load BS calendar data' },
      { status: 500 }
    );
  }
}

