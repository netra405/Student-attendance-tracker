'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';

type DataState = {
  minYear: number;
  maxYear: number;
  years: Record<string, number[]>;
};

export default function BSCalendarManagerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [data, setData] = useState<DataState | null>(null);

  const [yearInput, setYearInput] = useState('2083');
  const [lengthsInput, setLengthsInput] = useState('31,31,32,31,31,30,30,30,29,30,30,30');
  const [regenMinYear, setRegenMinYear] = useState('1977');
  const [regenMaxYear, setRegenMaxYear] = useState('2200');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/bs-calendar');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load data');
      setData({
        minYear: result.minYear,
        maxYear: result.maxYear,
        years: result.years || {},
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) loadData();
  }, [session?.user]);

  const handleRegenerate = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/admin/bs-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          minYear: Number(regenMinYear),
          maxYear: Number(regenMaxYear),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to regenerate data');
      setMessage(
        `Calendar regenerated successfully for BS ${result.minYear}-${result.maxYear}.`
      );
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateYear = async () => {
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const year = Number(yearInput);
      const monthLengths = lengthsInput
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v));

      const res = await fetch('/api/admin/bs-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-year',
          year,
          monthLengths,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update year');
      setMessage(result.message || `Updated BS year ${year} successfully.`);
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentYearPreview = data?.years[yearInput];

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen">
      <Navbar user={session?.user} />
      <div className="flex">
        <Sidebar />
        <div className="flex-1">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold">BS Calendar Data Manager</h1>
            <p className="text-gray-300">
              Regenerate BS dataset (same as <code>npm run generate:bs-data</code>) or
              manually correct a specific BS year month length.
            </p>

            {error && <div className="bg-red-900/40 border border-red-700 text-red-200 p-3 rounded-lg">{error}</div>}
            {message && <div className="bg-green-900/40 border border-green-700 text-green-200 p-3 rounded-lg">{message}</div>}

            <AnimatedCard>
              <h2 className="text-xl font-semibold mb-4">Regenerate Full Dataset</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={regenMinYear}
                  onChange={(e) => setRegenMinYear(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="Min BS year"
                />
                <input
                  value={regenMaxYear}
                  onChange={(e) => setRegenMaxYear(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="Max BS year"
                />
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={handleRegenerate}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Regenerate Dataset'}
              </button>
            </AnimatedCard>

            <AnimatedCard>
              <h2 className="text-xl font-semibold mb-4">Manual Year Correction</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="BS year (e.g. 2083)"
                />
                <input
                  value={lengthsInput}
                  onChange={(e) => setLengthsInput(e.target.value)}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg"
                  placeholder="31,31,32,31,31,30,30,30,29,30,30,30"
                />
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Enter exactly 12 comma-separated month lengths, each between 28 and 32.
              </p>
              <button
                type="button"
                disabled={loading}
                onClick={handleUpdateYear}
                className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Update Year Data'}
              </button>
              {currentYearPreview && (
                <p className="mt-3 text-sm text-gray-300">
                  Current saved value for {yearInput}: [{currentYearPreview.join(', ')}]
                </p>
              )}
            </AnimatedCard>

            <AnimatedCard>
              <h2 className="text-xl font-semibold mb-2">Current Dataset Range</h2>
              <p className="text-gray-300">
                {data
                  ? `${data.minYear} BS to ${data.maxYear} BS`
                  : loading
                    ? 'Loading...'
                    : 'Not loaded'}
              </p>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );
}

