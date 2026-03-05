'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';
import Calendar from '@/components/Calendar';

interface Student {
  _id: string;
  name: string;
  rollNumber: string;
  email: string;
}

type AttendanceStatus = 'present' | 'absent' | 'leave';

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const [attendance, setAttendance] = useState<
    Record<string, AttendanceStatus>
  >({});

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Auth redirect
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  // Fetch students safely
  const fetchStudents = useCallback(async () => {
    try {
      setFetching(true);

      const res = await fetch('/api/students');
      const result = await res.json();

      const data = Array.isArray(result)
        ? result
        : result.students || [];

      setStudents(data);

      // Initialize attendance state
      const initAttendance: Record<string, AttendanceStatus> = {};

      data.forEach((student: Student) => {
        initAttendance[student._id] = 'present';
      });

      setAttendance(initAttendance);
    } catch (error) {
      console.error('Failed fetching students', error);
      setStudents([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchStudents();
  }, [session, fetchStudents]);

  // Load attendance for selected date (past or future) so user can see results
  useEffect(() => {
    if (!session?.user || !selectedDate) return;
    const d = new Date(selectedDate);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    fetch(`/api/attendance?month=${month}&year=${year}`)
      .then((res) => res.json())
      .then((data) => {
        const records = data.records || [];
        const dateStr = selectedDate;
        const forDay: Record<string, AttendanceStatus> = {};
        records.forEach((r: any) => {
          const rDate = r.date ? new Date(r.date).toISOString().split('T')[0] : '';
          if (rDate === dateStr && r.studentId?._id) {
            const status = r.status === 'present' || r.status === 'absent' || r.status === 'leave'
              ? r.status
              : 'present';
            forDay[r.studentId._id] = status;
          }
        });
        setAttendance((prev) => {
          const next = { ...prev };
          students.forEach((s) => {
            next[s._id] = forDay[s._id] ?? prev[s._id] ?? 'present';
          });
          return next;
        });
      })
      .catch(() => {});
  }, [session?.user, selectedDate, students]);

  // Attendance status change
  const handleStatusChange = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      setAttendance((prev) => ({
        ...prev,
        [studentId]: status,
      }));
    },
    []
  );

  // Bulk attendance submit (🔥 optimized version)
  const handleSubmit = async () => {
    if (!students.length) return;

    setLoading(true);

    try {
      const records = Object.entries(attendance).map(
        ([studentId, status]) => ({
          studentId,
          status,
          date: selectedDate,
        })
      );

      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      if (!res.ok) throw new Error('Attendance save failed');
       // ✅ Success Alert
    alert('✅ Attendance saved successfully');
      console.log('Attendance saved successfully ✅');
    } catch (error) {
      console.error(error);
      alert('Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Loading UI
  if (status === 'loading' || fetching) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-900'>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
          className='text-4xl'
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar user={session?.user} />

        <div className="flex-1 overflow-auto bg-gray-900">
          <div className='max-w-4xl mx-auto p-6 space-y-6 text-gray-100'>

            <h1 className='text-4xl font-bold text-white'>
              Mark Attendance ✅
            </h1>

            <p className="text-gray-300">
              Select attendance status for each student
            </p>

            {/* Date Selector */}
            <AnimatedCard delay={0.1}>
              <div className='flex flex-col gap-3'>
                <span className='text-lg font-medium'>Select Date (Bikram Sambat) — view past or upcoming:</span>
                <Calendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>
            </AnimatedCard>

            {/* Student List */}
            <div className='space-y-4'>
              {students.map((student, index) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <AnimatedCard delay={0.1 + index * 0.03}>
                    <div className='flex flex-col md:flex-row md:justify-between md:items-center gap-4'>

                      <div>
                        <h3 className='text-lg font-bold text-white'>
                          {student.name}
                        </h3>

                        <p className="text-gray-300 text-sm">
                          {student.rollNumber} • {student.email}
                        </p>
                      </div>

                      {/* Status Buttons */}
                      <div className='flex flex-wrap gap-3'>
                        {(['present', 'absent', 'leave'] as const).map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() =>
                                handleStatusChange(student._id, status)
                              }
                              className={`px-5 py-2 rounded-lg font-medium transition ${
                                attendance[student._id] === status
                                  ? status === 'present'
                                    ? 'bg-green-500 text-white'
                                    : status === 'absent'
                                    ? 'bg-red-500 text-white'
                                    : 'bg-yellow-500 text-white'
                                  : 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                              }`}
                            >
                              {status === 'present' && '✅ Present'}
                              {status === 'absent' && '❌ Absent'}
                              {status === 'leave' && '📋 Leave'}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </AnimatedCard>
                </motion.div>
              ))}
            </div>

            {/* Submit Button */}
            <div className='flex justify-end pt-6'>
              <button
                onClick={handleSubmit}
                disabled={loading || !students.length}
                className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-medium disabled:opacity-50'
              >
                {loading ? 'Saving...' : '💾 Save Attendance'}
              </button>
            </div>

            {/* Empty State */}
            {!students.length && (
              <div className='text-center py-12 text-gray-400'>
                No students found. Add students first.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}