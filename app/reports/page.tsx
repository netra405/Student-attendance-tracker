'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';
import Calendar from '@/components/Calendar';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  phone?: string;
}

interface ReportStats {
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  total: number;
  percentage: number;
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

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  useEffect(() => {
    if (session?.user) fetchReportData();
  }, [session, month, year]);

  const fetchReportData = async () => {
    try {
      setStudentStats({});
      setReportData([]);

      const studentsRes = await fetch('/api/students');
      const studentsResult = await studentsRes.json();

      const studentsData: Student[] = Array.isArray(studentsResult)
        ? studentsResult
        : studentsResult.students || [];

      setStudents(studentsData);

      const attendanceRes = await fetch(
        `/api/attendance?month=${month}&year=${year}`
      );

      const attendanceData = await attendanceRes.json();
      const records = attendanceData.records || [];

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
            date: date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            }),
            present,
            absent,
          });
        }
      }

      studentsData.forEach((student) => {
        let present = 0;
        let absent = 0;
        let leave = 0;

        records.forEach((record: any) => {
          if (record.studentId?._id === student._id) {
            if (record.status === 'present') present++;
            else if (record.status === 'absent') absent++;
            else if (record.status === 'leave') leave++;
          }
        });

        const total = present + absent + leave;

        stats[student.name] = {
          presentCount: present,
          absentCount: absent,
          leaveCount: leave,
          total,
          percentage: total ? Number(((present / total) * 100).toFixed(2)) : 0,
        };
      });

      setReportData(dailyData);
      setStudentStats(stats);

    } catch (error) {
      console.error(error);
    }
  };

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
    ([name, stats]: [string, any]) => {
      const student = students.find(s => s.name === name);

      return {
        name,
        phone: student?.phone || '',
        ...stats,
      };
    }
  );

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">

        <Navbar user={session?.user} />

        <div className="flex-1 overflow-y-auto">

          <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6 text-gray-100">

            <div className="flex flex-col md:flex-row justify-between gap-4">

              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Reports 📈
              </h1>

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
                  label="Select Date (Bikram Sambat) — view past or upcoming month"
                />
              </div>
            </div>

            {/* Chart */}
            <AnimatedCard>
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Daily Attendance Trend
              </h2>

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

            {/* Table → Card View Mobile Responsive */}
            <AnimatedCard>
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                Attendance Percentage Report
              </h2>

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm md:text-base">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4">Present</th>
                      <th className="py-3 px-4">Absent</th>
                      <th className="py-3 px-4">Leave</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Percentage</th>
                      <th className="py-3 px-4">Call</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reportRows.map((row) => (
                      <tr key={row.name}
                        className="border-b border-gray-700 hover:bg-gray-800 transition"
                      >
                        <td className="py-3 px-4">{row.name}</td>
                        <td className="py-3 px-4 text-green-500">{row.presentCount}</td>
                        <td className="py-3 px-4 text-red-500">{row.absentCount}</td>
                        <td className="py-3 px-4 text-yellow-500">{row.leaveCount}</td>
                        <td className="py-3 px-4">{row.total}</td>
                        <td className="py-3 px-4">{row.percentage}%</td>

                        <td className="py-3 px-4">
                          {row.phone && (
                            <a href={`tel:${row.phone}`}
                              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg text-white text-sm">
                              📞 Call
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
                {reportRows.map(row => (
                  <div key={row.name}
                    className="bg-gray-800 p-4 rounded-xl space-y-2"
                  >
                    <div className="font-semibold text-lg">{row.name}</div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>✅ Present: {row.presentCount}</div>
                      <div>❌ Absent: {row.absentCount}</div>
                      <div>📋 Leave: {row.leaveCount}</div>
                      <div>📊 Total: {row.total}</div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">
                        {row.percentage}%
                      </span>

                      {row.phone && (
                        <a href={`tel:${row.phone}`}
                          className="bg-green-500 px-3 py-1 rounded-lg text-sm text-white">
                          📞 Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedCard>

          </div>
        </div>
      </div>
    </div>
  );
}