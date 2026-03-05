'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  className: string;
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    phone: '',
    className: '',
  });

  // Auth redirect
  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      setFetching(true);

      const res = await fetch('/api/students');
      const result = await res.json();

      const data = Array.isArray(result)
        ? result
        : result.students || [];

      setStudents(data);
    } catch (error) {
      console.error(error);
      setStudents([]);
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchStudents();
  }, [session, fetchStudents]);

  // Add student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to add student');

      const newStudent = await res.json();

      setStudents((prev) => [newStudent, ...prev]);

      setFormData({
        name: '',
        email: '',
        rollNumber: '',
        phone: '',
        className: '',
      });

      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  // Delete student
  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');

      setStudents((prev) => prev.filter((s) => s._id !== id));
    } catch (error) {
      console.error(error);
      alert('Failed to delete student');
    }
  };

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
          <div className='max-w-6xl mx-auto p-6 space-y-6 text-gray-100'>

            {/* Header */}
            <div className='flex justify-between items-center flex-wrap gap-4'>
              <div>
                <h1 className='text-4xl font-bold text-white'>Students 👥</h1>
                <p className="text-gray-300 mt-1">Manage your student list</p>
              </div>

              <button
                onClick={() => setShowForm((v) => !v)}
                className='bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium'
              >
                + Add Student
              </button>
            </div>

            {/* Add Student Form */}
            {showForm && (
              <AnimatedCard>
                <h2 className="text-2xl font-bold mb-6 text-white">
                  Add New Student
                </h2>

                <form onSubmit={handleAddStudent} className="space-y-4">

                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Roll Number"
                    value={formData.rollNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, rollNumber: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />

                  <input
                    type="tel"
                    placeholder="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />

                  <input
                    type="text"
                    placeholder="Class Name"
                    value={formData.className}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        className: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    required
                  />

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
                    >
                      {loading ? 'Adding...' : 'Add Student'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="border border-gray-600 px-6 py-2 rounded-lg text-white hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>

                </form>
              </AnimatedCard>
            )}

            {/* Empty State */}
            {!students.length && !showForm && (
              <div className='text-center py-16 text-gray-400'>
                No students found. Click Add Student.
              </div>
            )}

            {/* Students List */}
            <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {students.map((student, index) => (
                <motion.div
                  key={student._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AnimatedCard>

                    <h3 className='text-lg font-bold text-white'>
                      {student.name}
                    </h3>

                    <div className="text-sm text-gray-300 space-y-1 mt-2">
                      <p>🎯 Roll: {student.rollNumber}</p>
                      <p>📧 {student.email}</p>
                      <p>📱 {student.phone}</p>
                      <p>🏫 Class {student.className}</p>
                    </div>

                    <button
                      onClick={() => handleDeleteStudent(student._id)}
                      className='w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg'
                    >
                      Delete
                    </button>

                  </AnimatedCard>
                </motion.div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}