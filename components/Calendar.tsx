
'use client';

import { useMemo, useState } from 'react';
import { ADToBS, BSToAD } from 'datex-bs';

interface CalendarProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  disablePast?: boolean;
}

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const BS_MONTHS = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

const START_BS_YEAR = 2082;
const RANGE_WINDOW = 50;

/* ---------------- Local Date Helpers ---------------- */

function getLocalIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseIsoAsUTC(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function formatUTCToIso(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function safeADToBS(iso: string) {
  try {
    return ADToBS(iso);
  } catch {
    return ADToBS(getLocalIso(new Date()));
  }
}

function getInitialBs(value?: string) {
  const base = value || getLocalIso(new Date());

  const bs = safeADToBS(base);
  const [y, m] = bs.split('-').map(Number);

  return {
    bsYear: y || START_BS_YEAR,
    bsMonth: m || 1,
  };
}

/* ---------------- Component ---------------- */

export default function Calendar({
  value,
  onChange,
  label,
  disablePast = false,
}: CalendarProps) {
  const initial = getInitialBs(value);

  const [bsYear, setBsYear] = useState(initial.bsYear);
  const [bsMonth, setBsMonth] = useState(initial.bsMonth);

  const todayIso = getLocalIso(new Date());
  const selectedIso = value;

  /* ---------- Year Dropdown Window ---------- */

  const yearRange = useMemo(() => {
    const from = Math.max(START_BS_YEAR, bsYear - RANGE_WINDOW);
    const to = bsYear + RANGE_WINDOW;

    return Array.from(
      { length: to - from + 1 },
      (_, i) => from + i
    );
  }, [bsYear]);

  /* ---------- Calendar Grid ---------- */

  const { days, monthLabel } = useMemo(() => {
    const result: Array<{ day: number | null; iso?: string }> = [];

    let firstWeekday: number | null = null;

    for (let day = 1; day <= 32; day++) {
      const bsDate = `${bsYear}-${String(bsMonth).padStart(
        2,
        '0'
      )}-${String(day).padStart(2, '0')}`;

      let iso;

      try {
        iso = BSToAD(bsDate);
      } catch {
        continue;
      }

      const weekday = parseIsoAsUTC(iso).getUTCDay();

      if (firstWeekday === null) {
        firstWeekday = weekday;

        for (let i = 0; i < firstWeekday; i++) {
          result.push({ day: null });
        }
      }

      result.push({ day, iso });
    }

    const monthLabel = `${BS_MONTHS[bsMonth - 1]} ${bsYear} (BS)`;

    return { days: result, monthLabel };
  }, [bsYear, bsMonth]);

  /* ---------- Navigation ---------- */

  const gotoPrevMonth = () => {
    try {
      const ad = BSToAD(
        `${bsYear}-${String(bsMonth).padStart(2, '0')}-01`
      );

      const d = parseIsoAsUTC(ad);
      d.setUTCMonth(d.getUTCMonth() - 1);

      const bs = safeADToBS(formatUTCToIso(d));
      const [y, m] = bs.split('-').map(Number);

      setBsYear(y);
      setBsMonth(m || 1);
    } catch {
      if (bsMonth === 1) {
        setBsYear((y) => y - 1);
        setBsMonth(12);
      } else {
        setBsMonth((m) => m - 1);
      }
    }
  };

  const gotoNextMonth = () => {
    try {
      const ad = BSToAD(
        `${bsYear}-${String(bsMonth).padStart(2, '0')}-01`
      );

      const d = parseIsoAsUTC(ad);
      d.setUTCMonth(d.getUTCMonth() + 1);

      const bs = safeADToBS(formatUTCToIso(d));
      const [y, m] = bs.split('-').map(Number);

      setBsYear(y);
      setBsMonth(m || 1);
    } catch {
      if (bsMonth === 12) {
        setBsYear((y) => y + 1);
        setBsMonth(1);
      } else {
        setBsMonth((m) => m + 1);
      }
    }
  };

  return (
    <div className="inline-block bg-gray-900 border border-gray-700 rounded-xl p-3 text-gray-100">

      {label && (
        <div className="mb-2 text-sm font-medium text-gray-200">
          {label}
        </div>
      )}

      {/* Year Month Jump */}
      <div className="flex flex-wrap gap-2 mb-3">

        <select
          value={bsYear}
          onChange={(e) => setBsYear(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100"
        >
          {yearRange.map((y) => (
            <option key={y} value={y}>
              {y} BS
            </option>
          ))}
        </select>

        <select
          value={bsMonth}
          onChange={(e) => setBsMonth(Number(e.target.value))}
          className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-100"
        >
          {BS_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={gotoPrevMonth}
          className="px-2 py-1 hover:bg-gray-800 rounded"
        >
          ‹
        </button>

        <span className="text-sm font-semibold">{monthLabel}</span>

        <button
          onClick={gotoNextMonth}
          className="px-2 py-1 hover:bg-gray-800 rounded"
        >
          ›
        </button>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 gap-1 text-xs mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-gray-400">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1 text-sm">
        {days.map((d, idx) => {
          if (!d.day) return <div key={idx} />;

          const isPast =
            disablePast && d.iso && d.iso < todayIso;

          const isSelected = d.iso === selectedIso;

          return (
            <button
              key={idx}
              type="button"
              disabled={Boolean(isPast)}
              onClick={() => d.iso && onChange(d.iso)}
              className={`h-8 w-8 flex items-center justify-center rounded-full text-xs
      ${isSelected
                  ? 'bg-blue-600 text-white'
                  : isPast
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 text-gray-100 hover:bg-gray-700'
                }`}
            >
              {d.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}