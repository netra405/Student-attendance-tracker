'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ADToBS } from 'bikram-sambat-js';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';
import Calendar from '@/components/Calendar';

const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];

function adToBSFormatted(date: Date): string {
  try {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`;
    const bs = ADToBS(iso);
    const [by, bm, bd] = bs.split('-').map(Number);
    return `${BS_MONTHS[bm - 1]} ${bd}, ${by}`;
  } catch {
    return '';
  }
}

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  phone?: string;
  className: string;
}

type TodayStatus = 'present' | 'absent' | 'leave' | null;

interface ReportStats {
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  total: number;
  percentage: number;
  todayStatus: TodayStatus;
  lastMarkedBS: string | null;
  yearlyPresent?: number;
  yearlyAbsent?: number;
  yearlyLeave?: number;
}

interface DailySummary {
  present: number;
  absent: number;
  leave: number;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const [reportData, setReportData] = useState<any[]>([]);
  const [studentStats, setStudentStats] = useState<Record<string, ReportStats>>({});
  const [classes, setClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      setStudentStats({});
      setReportData([]);

      const studentsRes = await fetch('/api/students');
      const studentsResult = await studentsRes.json();

      const studentsData: Student[] = Array.isArray(studentsResult)
        ? studentsResult
        : studentsResult.students || [];

      setStudents(studentsData);

      const classList = Array.from(
        new Set(studentsData.map((s) => s.className).filter(Boolean))
      );
      setClasses(classList);
      setSelectedClass((prev) => prev || (classList[0] ?? ''));

      const effectiveClass = selectedClass || 'all';
      const classParam =
        effectiveClass && effectiveClass !== 'all'
          ? `&class=${encodeURIComponent(effectiveClass)}`
          : '&class=all';

      const attendanceRes = await fetch(
        `/api/attendance?month=${month}&year=${year}${classParam}`
      );

      const attendanceData = await attendanceRes.json();
      const records = attendanceData.records || [];

      // Yearly stats for each student (current year, same class filter)
      const yearlyClassParam =
        effectiveClass && effectiveClass !== 'all'
          ? `&class=${encodeURIComponent(effectiveClass)}`
          : '&class=all';

      const yearlyRes = await fetch(
        `/api/attendance?year=${year}${yearlyClassParam}`
      );
      const yearlyData = await yearlyRes.json();
      const yearlyRecords = yearlyData.records || [];

      const yearlyStatsMap: Record<
        string,
        { present: number; absent: number; leave: number }
      > = {};

      yearlyRecords.forEach((record: any) => {
        const recordStudentId = record.studentId?._id ?? record.studentId;
        if (!recordStudentId) return;

        const student = studentsData.find(
          (s) => String(s._id) === String(recordStudentId)
        );
        if (!student) return;

        if (selectedClass && student.className !== selectedClass) {
          return;
        }

        const key = student.name;
        if (!yearlyStatsMap[key]) {
          yearlyStatsMap[key] = { present: 0, absent: 0, leave: 0 };
        }

        if (record.status === 'present') yearlyStatsMap[key].present++;
        else if (record.status === 'absent') yearlyStatsMap[key].absent++;
        else if (record.status === 'leave') yearlyStatsMap[key].leave++;
      });

      const stats: Record<string, ReportStats> = {};
      const dailyData: any[] = [];

      const daysInMonth = new Date(year, month, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dateStr = date.toISOString().split('T')[0];

        let present = 0;
        let absent = 0;

        records.forEach((record: any) => {
          const recordDate = new Date(record.date)
            .toISOString()
            .split('T')[0];

          if (recordDate === dateStr) {
            if (record.status === 'present') present++;
            else if (record.status === 'absent') absent++;
          }
        });

        if (present > 0 || absent > 0) {
          dailyData.push({
            date: date.toLocaleString('en-NP', {
              timeZone: 'Asia/Kathmandu',
              month: 'short',
              day: 'numeric',
            }),
            present,
            absent,
          });
        }
      }

      // Per-student stats: today's status, last marked (BS), monthly counts for pie
      studentsData.forEach((student) => {
        if (selectedClass && student.className !== selectedClass) {
          return;
        }

        let present = 0;
        let absent = 0;
        let leave = 0;
        let lastMarkedDate: Date | null = null;
        let todayStatus: TodayStatus = null;

        records.forEach((record: any) => {
          const recordStudentId = record.studentId?._id ?? record.studentId;
          if (!recordStudentId || String(recordStudentId) !== String(student._id)) return;

          const recordDate = record.date ? new Date(record.date) : null;
          if (!recordDate || isNaN(recordDate.getTime())) return;
          const recordIso = recordDate.toISOString().slice(0, 10);
          const recordNepal = recordDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' });
          const matchesSelectedDate = recordIso === selectedDate || recordNepal === selectedDate;

          if (matchesSelectedDate) {
            todayStatus = record.status as TodayStatus;
          }

          if (!lastMarkedDate || recordDate > lastMarkedDate) {
            lastMarkedDate = recordDate;
          }

          if (record.status === 'present') present++;
          else if (record.status === 'absent') absent++;
          else if (record.status === 'leave') leave++;
        });

        const total = present + absent + leave;

        stats[student.name] = {
          presentCount: present,
          absentCount: absent,
          leaveCount: leave,
          total,
          percentage: total ? Number(((present / total) * 100).toFixed(2)) : 0,
          todayStatus,
          lastMarkedBS: lastMarkedDate ? adToBSFormatted(lastMarkedDate) : null,
          yearlyPresent: yearlyStatsMap[student.name]?.present ?? 0,
          yearlyAbsent: yearlyStatsMap[student.name]?.absent ?? 0,
          yearlyLeave: yearlyStatsMap[student.name]?.leave ?? 0,
        };
      });

      setReportData(dailyData);
      setStudentStats(stats);

      // Daily summary for the selected date (Nepal time based on AD ISO)
      if (selectedDate) {
        let dayPresent = 0;
        let dayAbsent = 0;
        let dayLeave = 0;

        records.forEach((record: any) => {
          const d = record.date ? new Date(record.date) : null;
          if (!d || isNaN(d.getTime())) return;
          const recordIso = d.toISOString().slice(0, 10);
          const recordNepal = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kathmandu' });
          const matches = recordIso === selectedDate || recordNepal === selectedDate;

          if (matches) {
            if (record.status === 'present') dayPresent++;
            else if (record.status === 'absent') dayAbsent++;
            else if (record.status === 'leave') dayLeave++;
          }
        });

        setDailySummary({
          present: dayPresent,
          absent: dayAbsent,
          leave: dayLeave,
        });
      } else {
        setDailySummary(null);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) fetchReportData();
  }, [session, month, year, selectedClass, selectedDate]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className="text-4xl"
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  const reportRows = Object.entries(studentStats).map(
    ([name, stats]: [string, ReportStats]) => {
      const student = students.find(s => s.name === name);
      const pieData = [
        { name: 'Present', value: stats.presentCount, color: '#22c55e' },
        { name: 'Absent', value: stats.absentCount, color: '#ef4444' },
        { name: 'Leave', value: stats.leaveCount, color: '#eab308' },
      ].filter((d) => d.value > 0);

      return {
        name,
        phone: student?.phone || '',
        pieData,
        ...stats,
      };
    }
  );

  const dailyTotal =
    dailySummary
      ? dailySummary.present + dailySummary.absent + dailySummary.leave
      : 0;

  const pieData = dailySummary
    ? [
      { name: 'Present', value: dailySummary.present, color: '#22c55e' },
      { name: 'Absent', value: dailySummary.absent, color: '#ef4444' },
      { name: 'Leave', value: dailySummary.leave, color: '#eab308' },
    ]
    : [];

  const selectedDateLabel = selectedDate
    ? new Date(selectedDate).toLocaleString('en-NP', {
      timeZone: 'Asia/Kathmandu',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : '';

  const selectedDateBS = selectedDate ? adToBSFormatted(new Date(selectedDate)) : '';

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        <Navbar user={session?.user} />

        <div className="flex-1 overflow-y-auto">

          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-gray-100">

            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Reports 📈
                </h1>
                <p className="text-gray-400 text-sm md:text-base">
                  Track attendance patterns and identify students who need attention
                </p>
              </div>

              <div className="flex gap-3 flex-wrap items-center">
                <Calendar
                  value={selectedDate}
                  onChange={(iso) => {
                    setSelectedDate(iso);
                    const d = new Date(iso);
                    if (!Number.isNaN(d.getTime())) {
                      setMonth(d.getMonth() + 1);
                      setYear(d.getFullYear());
                    }
                  }}
                  label="Select Date (Bikram Sambat)"
                />
              </div>
            </div>

            {/* Class-wise Absenteeism Report */}
            {selectedClass && (
              <AnimatedCard>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                      🎯 Class-wise Absenteeism Report
                    </h2>
                    <p className="text-sm text-gray-400">
                      {selectedClass} • Students sorted by most absent days
                    </p>
                  </div>
                  {selectedDateBS && (
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Nepali Date</div>
                      <div className="text-sm font-semibold text-blue-400">{selectedDateBS}</div>
                    </div>
                  )}
                </div>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-4xl"
                      >
                        ⏳
                      </motion.div>
                      <p className="text-gray-400">Loading absenteeism data...</p>
                    </div>
                  </div>
                ) : Object.entries(studentStats).filter(([name]) => {
                  const student = students.find(s => s.name === name);
                  return student && student.className === selectedClass;
                }).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-gray-400">No attendance data found for {selectedClass}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(studentStats)
                    .filter(([name]) => {
                      const student = students.find(s => s.name === name);
                      return student && student.className === selectedClass;
                    })
                    .sort(([,a], [,b]) => (b.yearlyAbsent || 0) - (a.yearlyAbsent || 0))
                    .map(([name, stats]) => {
                      const student = students.find(s => s.name === name);
                      const yearlyPieData = [
                        { name: 'Present', value: stats.yearlyPresent || 0, color: '#22c55e' },
                        { name: 'Absent', value: stats.yearlyAbsent || 0, color: '#ef4444' },
                        { name: 'Leave', value: stats.yearlyLeave || 0, color: '#eab308' },
                      ].filter((d) => d.value > 0);

                      const totalYearly = (stats.yearlyPresent || 0) + (stats.yearlyAbsent || 0) + (stats.yearlyLeave || 0);

                      return (
                        <motion.div 
                          key={name} 
                          className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl space-y-3 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * (Object.entries(studentStats).findIndex(([n]) => n === name) % 6) }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-white">{name}</div>
                                <div className="text-xs text-gray-400">Roll: {student?.rollNumber || 'N/A'}</div>
                              </div>
                            </div>
                            {stats.yearlyAbsent && stats.yearlyAbsent > 10 && (
                              <div className="px-2 py-1 bg-red-500/20 border border-red-500/50 rounded-full">
                                <span className="text-xs text-red-400 font-medium">High Risk</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-center">
                            <div className="relative">
                              <div className="w-32 h-32">
                                {yearlyPieData.length > 0 ? (
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={yearlyPieData}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={50}
                                        innerRadius={20}
                                        paddingAngle={2}
                                        animationBegin={0}
                                        animationDuration={800}
                                      >
                                        {yearlyPieData.map((entry, i) => (
                                          <Cell key={i} fill={entry.color} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                    </PieChart>
                                  </ResponsiveContainer>
                                ) : (
                                  <div className="w-full h-full rounded-full bg-gray-700/50 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-600">
                                    <div className="text-center">
                                      <div className="text-2xl mb-1">📊</div>
                                      <div>No Data</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {totalYearly > 0 && (
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-400">
                                    {((stats.yearlyPresent || 0) / totalYearly * 100).toFixed(0)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-gray-700/30 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-400">Total Days</div>
                                <div className="font-semibold text-white">{totalYearly}</div>
                              </div>
                              <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2 text-center">
                                <div className="text-xs text-red-400">Absent</div>
                                <div className="font-semibold text-red-400">{stats.yearlyAbsent || 0}</div>
                              </div>
                              <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-2 text-center">
                                <div className="text-xs text-green-400">Present</div>
                                <div className="font-semibold text-green-400">{stats.yearlyPresent || 0}</div>
                              </div>
                              <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-2 text-center">
                                <div className="text-xs text-amber-400">Leave</div>
                                <div className="font-semibold text-amber-400">{stats.yearlyLeave || 0}</div>
                              </div>
                            </div>
                            {totalYearly > 0 && (
                              <div className="pt-2 border-t border-gray-700">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-gray-400">Attendance Rate</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-12 h-2 bg-gray-700 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-linear-to-r from-blue-500 to-purple-600 transition-all duration-500"
                                        style={{ width: `${((stats.yearlyPresent || 0) / totalYearly * 100)}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-blue-400">
                                      {((stats.yearlyPresent || 0) / totalYearly * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {stats.yearlyAbsent && stats.yearlyAbsent > 10 && (
                            <motion.div 
                              className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-lg"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3, delay: 0.5 }}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-400">⚠️</span>
                                <span className="text-xs text-red-400 font-medium">High Absenteeism Alert</span>
                              </div>
                              <div className="text-xs text-red-300">
                                {stats.yearlyAbsent} days absent this year • Requires immediate attention
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </AnimatedCard>
            )}

            {classes.length > 0 && (
              <AnimatedCard>
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">📚 Choose Class</h2>
                    <p className="text-sm text-gray-400">Select a class to view detailed attendance reports</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {classes.map((className, index) => {
                      const isActive = selectedClass === className;
                      return (
                        <motion.button
                          key={className}
                          type="button"
                          onClick={() => setSelectedClass(className)}
                          className={`px-4 md:px-6 py-2.5 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-200 border ${isActive
                              ? 'bg-linear-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg shadow-blue-500/40 scale-[1.02]'
                              : 'bg-gray-800/90 text-gray-200 border-gray-700 hover:bg-gray-700 hover:border-gray-500 hover:scale-[1.02]'
                            }`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="flex items-center gap-2">
                            <span>{isActive ? '✓' : '📁'}</span>
                            <span>{className}</span>
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                  {selectedClass && (
                    <motion.div 
                      className="text-sm text-blue-400 bg-blue-900/20 border border-blue-800/50 rounded-lg p-3"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="flex items-center gap-2">
                        <span>🎯</span>
                        <span>Showing reports for <strong>{selectedClass}</strong></span>
                      </span>
                    </motion.div>
                  )}
                </div>
              </AnimatedCard>
            )}

            {/* Chart */}
            <AnimatedCard>
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">📈 Daily Attendance Trend</h2>
                <p className="text-sm text-gray-400">Monthly overview of attendance patterns</p>
              </div>

              <div className="h-[280px] md:h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Legend />

                    <Line dataKey="present" stroke="#3b82f6" />
                    <Line dataKey="absent" stroke="#ef4444" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>

            {/* Pie Chart for selected date (Bikram Sambat) */}
            {dailyTotal > 0 && (
              <AnimatedCard>
                <div className="mb-4">
                  <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                    🎂 Attendance Breakdown — {selectedDateBS} (BS)
                  </h2>
                  <p className="text-sm text-gray-400">
                    Daily attendance distribution for the selected Nepali calendar date
                  </p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-1/2 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          innerRadius={40}
                          paddingAngle={3}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full md:w-1/2 space-y-3">
                    {pieData.map((entry) => (
                      <div
                        key={entry.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-gray-200">{entry.name}</span>
                        </div>
                        <span className="font-semibold text-gray-100">
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedCard>
            )}

            {/* Attendance Summary by Student — today's status, month pie, last marked (BS) */}
            <AnimatedCard>
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-1">
                  👥 Attendance Summary by Student
                </h2>
                <p className="text-sm text-gray-400">
                  Individual student attendance details with yearly statistics and contact information
                </p>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4 text-left text-gray-300 font-semibold">Student</th>
                      <th className="py-3 px-4 text-center text-gray-300 font-semibold">Today&apos;s Status</th>
                      <th className="py-3 px-4 text-center text-gray-300 font-semibold">Month Result</th>
                      <th className="py-3 px-4 text-center text-gray-300 font-semibold">Year Total (P / A / L)</th>
                      <th className="py-3 px-4 text-center text-gray-300 font-semibold">Last Marked (BS)</th>
                      <th className="py-3 px-4 text-center text-gray-300 font-semibold">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportRows.map((row) => (
                      <tr key={row.name}
                        className="border-b border-gray-700 hover:bg-gray-800 transition"
                      >
                        <td className="py-3 px-4 font-medium">{row.name}</td>
                        <td className="py-3 px-4">
                          {row.todayStatus === 'present' && (
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-green-500">
                              <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                              Present
                            </span>
                          )}
                          {row.todayStatus === 'absent' && (
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-red-500">
                              <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                              Absent
                            </span>
                          )}
                          {row.todayStatus === 'leave' && (
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-400">
                              <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                              Leave
                            </span>
                          )}
                          {!row.todayStatus && (
                            <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                              <span className="h-2 w-2 rounded-full bg-gray-500 shrink-0" />
                              Not marked
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="w-14 h-14">
                            {row.pieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={row.pieData}
                                    dataKey="value"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={22}
                                    innerRadius={8}
                                    paddingAngle={2}
                                  >
                                    {row.pieData.map((entry, i) => (
                                      <Cell key={i} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="w-full h-full rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-200">
                          {((row.yearlyPresent ?? 0) +
                            (row.yearlyAbsent ?? 0) +
                            (row.yearlyLeave ?? 0)) > 0 ? (
                            <span>
                              P: {row.yearlyPresent ?? 0} • A:{' '}
                              {row.yearlyAbsent ?? 0} • L:{' '}
                              {row.yearlyLeave ?? 0}
                            </span>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-blue-300 text-sm">
                          {row.lastMarkedBS || 'Not marked yet'}
                        </td>
                        <td className="py-3 px-4">
                          {row.phone && (
                            <a href={`tel:${row.phone}`}
                              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors duration-200"
                            >
                              <span>📞</span>
                              <span>Call</span>
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4">
                {reportRows.map((row, index) => (
                  <motion.div 
                    key={row.name}
                    className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl space-y-3 border border-gray-700"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="font-semibold text-white">{row.name}</div>
                      </div>
                      {row.phone && (
                        <a href={`tel:${row.phone}`}
                          className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm text-white font-medium transition-colors duration-200 flex items-center gap-1"
                        >
                          <span>📞</span>
                          <span>Call</span>
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-2">Today's Status</div>
                        {row.todayStatus === 'present' && (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-green-500 bg-green-900/20 px-2 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                            Present
                          </span>
                        )}
                        {row.todayStatus === 'absent' && (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-red-500 bg-red-900/20 px-2 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                            Absent
                          </span>
                        )}
                        {row.todayStatus === 'leave' && (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 bg-amber-900/20 px-2 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                            Leave
                          </span>
                        )}
                        {!row.todayStatus && (
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 bg-gray-700/50 px-2 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-gray-500 shrink-0" />
                            Not marked
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-14 h-14">
                          {row.pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={row.pieData}
                                  dataKey="value"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={20}
                                  innerRadius={8}
                                  paddingAngle={2}
                                  animationBegin={0}
                                  animationDuration={600}
                                >
                                  {row.pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="w-full h-full rounded-full bg-gray-700/50 flex items-center justify-center text-[10px] text-gray-500 border border-dashed border-gray-600">—</div>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">Month</div>
                      </div>

                      <div className="flex-1 text-right">
                        <div className="text-xs text-gray-400 mb-1">Last Marked</div>
                        <div className="text-xs text-blue-300 font-medium">{row.lastMarkedBS || '—'}</div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold text-gray-200">Yearly Statistics</div>
                        {((row.yearlyPresent ?? 0) + (row.yearlyAbsent ?? 0) + (row.yearlyLeave ?? 0)) > 0 && (
                          <div className="text-xs font-semibold text-blue-400">
                            {(((row.yearlyPresent ?? 0) / ((row.yearlyPresent ?? 0) + (row.yearlyAbsent ?? 0) + (row.yearlyLeave ?? 0))) * 100).toFixed(1)}% Attendance
                          </div>
                        )}
                      </div>
                      {((row.yearlyPresent ?? 0) + (row.yearlyAbsent ?? 0) + (row.yearlyLeave ?? 0)) > 0 ? (
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-green-900/20 border border-green-800/50 rounded-lg p-2 text-center">
                            <div className="text-green-400 font-semibold">{row.yearlyPresent ?? 0}</div>
                            <div className="text-green-400/70">Present</div>
                          </div>
                          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-2 text-center">
                            <div className="text-red-400 font-semibold">{row.yearlyAbsent ?? 0}</div>
                            <div className="text-red-400/70">Absent</div>
                          </div>
                          <div className="bg-amber-900/20 border border-amber-800/50 rounded-lg p-2 text-center">
                            <div className="text-amber-400 font-semibold">{row.yearlyLeave ?? 0}</div>
                            <div className="text-amber-400/70">Leave</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-xs text-gray-500">No records this year</div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

          </div>
        </div>
      </div>
    </div>
  );
}

