'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import StatCard from '@/components/StatCard';
import AnimatedCard from '@/components/AnimatedCard';

const COLORS = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981'];

export default function DashboardPage() {

  const { data: session, status } = useSession();
  const router = useRouter();

  const [className, setClassName] = useState('all');
  const [classList, setClassList] = useState<string[]>([]);

  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    absentToday: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [lineData, setLineData] = useState<any[]>([]);

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  const fetchDashboard = async () => {
    try {

      const studentsRes = await fetch('/api/students');
      const studentsResult = await studentsRes.json();

      const students = Array.isArray(studentsResult)
        ? studentsResult
        : studentsResult.students || [];

      const classes: string[] = Array.from(
        new Set(
          students
            .map((s: any) => s.className)
            .filter((c: any): c is string => Boolean(c))
        )
      );

      setClassList(classes);

      const filteredStudents =
        className === 'all'
          ? students
          : students.filter((s: any) => s.className === className);

      const attendanceRes = await fetch(
        `/api/attendance?month=${month}&year=${year}&class=${className}`
      );

      const attendanceResult = await attendanceRes.json();
      const records = attendanceResult.records || [];

      // Today Attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayRecords = records.filter((r: any) => {
        const recordDate = new Date(r.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime();
      });

      const presentCount = todayRecords.filter(
        (r: any) => r.status === 'present'
      ).length;

      const absentCount = todayRecords.filter(
        (r: any) => r.status === 'absent'
      ).length;

      const leaveCount = todayRecords.filter(
        (r: any) => r.status === 'leave'
      ).length;

      setStats({
        totalStudents: filteredStudents.length,
        presentToday: presentCount,
        absentToday: absentCount,
      });

      // Weekly Chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const weeklyData = last7Days.map((date) => {

        const dayRecords = records.filter((r: any) => {
          const recordDate = new Date(r.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate.getTime() === date.getTime();
        });

        return {
          name: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          present: dayRecords.filter((r: any) => r.status === 'present').length,
          absent: dayRecords.filter((r: any) => r.status === 'absent').length,
        };

      });

      setChartData(weeklyData);

      setPieData([
        { name: 'Present', value: presentCount },
        { name: 'Absent', value: absentCount },
        { name: 'Leave', value: leaveCount },
      ]);

      // Line Trend based on actual attendance (present count per day)
      const trend = weeklyData.map((d) => ({
        name: d.name,
        attendance: d.present,
      }));

      setLineData(trend);

    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (session?.user) fetchDashboard();
  }, [session, className]);

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

  return (
    <div className="flex h-screen bg-gray-900">

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">

        <Navbar user={session?.user} />

        <div className="flex-1 overflow-auto bg-gray-900">

          <div className="max-w-7xl mx-auto p-6 space-y-8 text-gray-100">

            {/* Header */}
            <div className="flex justify-between flex-wrap gap-4">
              <h1 className="text-4xl font-bold text-white">
                Dashboard 📊
              </h1>

              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="all">All Classes</option>

                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <StatCard icon="👥" label="Total Students" value={stats.totalStudents} color="bg-blue-500" />
              <StatCard icon="✅" label="Present Today" value={stats.presentToday} color="bg-green-500" />
              <StatCard icon="❌" label="Absent Today" value={stats.absentToday} color="bg-red-500" />
            </div>

            {/* Charts Grid */}
            <div className="grid lg:grid-cols-2 gap-6">

              <AnimatedCard delay={0.2}>
                <h2 className="text-xl font-bold mb-4">
                  Weekly Attendance
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Bar dataKey="present" fill="#3b82f6" />
                    <Bar dataKey="absent" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </AnimatedCard>

              <AnimatedCard delay={0.3}>
                <h2 className="text-xl font-bold mb-4">
                  Today Distribution
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {COLORS.map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </AnimatedCard>

              <AnimatedCard delay={0.4} className="lg:col-span-2">
                <h2 className="text-xl font-bold mb-4">
                  Attendance Trend Line
                </h2>

                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip />
                    <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </AnimatedCard>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}