'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ADToBS } from 'bikram-sambat-js';

import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';

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

interface Student {
  _id: string;
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  className: string;
  createdAt?: string;
}

interface StudentFormData {
  name: string;
  email: string;
  rollNumber: string;
  phone: string;
  className: string;
}

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

function getRelativeTimeFromNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs <= 0) return 'Just now';

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears >= 1) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths >= 1) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  }

  if (diffDays >= 1) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours >= 1) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes >= 1) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  }

  return 'Just now';
}

export default function StudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    rollNumber: '',
    phone: '',
    className: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');

  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<StudentFormData>({
    name: '',
    email: '',
    rollNumber: '',
    phone: '',
    className: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status]);

  const fetchStudents = useCallback(async () => {
    try {
      setFetching(true);

      const res = await fetch('/api/students');
      const result = await res.json();

      const data: Student[] = Array.isArray(result)
        ? result
        : result.students || [];

      setStudents(data);

      if (!selectedClass && data.length > 0) {
        setSelectedClass(data[0].className);
      }
    } catch (error) {
      console.error(error);
      setStudents([]);
    } finally {
      setFetching(false);
    }
  }, [selectedClass]);

  useEffect(() => {
    if (session?.user) fetchStudents();
  }, [session, fetchStudents]);

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

      const newStudent: Student = await res.json();

      setStudents((prev) => [newStudent, ...prev]);

      setFormData({
        name: '',
        email: '',
        rollNumber: '',
        phone: '',
        className: '',
      });

      if (!selectedClass) {
        setSelectedClass(newStudent.className);
      }

      setShowForm(false);
    } catch (error) {
      console.error(error);
      alert('Failed to add student');
    } finally {
      setLoading(false);
    }
  };

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

  const handleStartEdit = (student: Student) => {
    setEditingStudentId(student._id);
    setEditFormData({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      phone: student.phone,
      className: student.className,
    });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingStudentId) return;

    try {
      const res = await fetch(`/api/students/${editingStudentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData),
      });

      if (!res.ok) throw new Error('Failed to update student');

      const updated: Student = await res.json();

      setStudents((prev) =>
        prev.map((s) => (s._id === updated._id ? updated : s))
      );

      setEditingStudentId(null);
    } catch (error) {
      console.error(error);
      alert('Failed to update student');
    }
  };

  const handleDeleteAllInClass = async () => {
    if (!selectedClass) return;

    const password = window.prompt(
      `Enter admin password to delete all students in class "${selectedClass}". This cannot be undone.`
    );
    if (!password) return;

    if (
      !window.confirm(
        `Are you absolutely sure you want to delete all students in class "${selectedClass}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/students?className=${encodeURIComponent(selectedClass)}`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const message =
          data?.error || 'Failed to delete all students for this class';
        throw new Error(message);
      }

      setStudents((prev) =>
        prev.filter((s) => s.className !== selectedClass)
      );

      const remainingClasses = Array.from(
        new Set(
          students
            .filter((s) => s.className !== selectedClass)
            .map((s) => s.className)
        )
      );
      setSelectedClass(remainingClasses[0] || '');
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to delete students for this class');
    }
  };

  if (status === 'loading' || fetching) {
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

  const classes = Array.from(
    new Set(students.map((s) => s.className).filter(Boolean))
  );

  const filteredStudents = students.filter((student) => {
    if (selectedClass && student.className !== selectedClass) return false;
    if (!searchTerm.trim()) return true;

    const q = searchTerm.toLowerCase();
    return (
      student.name.toLowerCase().includes(q) ||
      student.rollNumber.toLowerCase().includes(q) ||
      student.email.toLowerCase().includes(q) ||
      student.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session?.user} />

        <div className="flex-1 overflow-auto bg-gray-900">
          <div className="max-w-6xl mx-auto p-6 space-y-6 text-gray-100">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h1 className="text-4xl font-bold text-white">Students 👥</h1>
                <p className="text-gray-300 mt-1">
                  Manage your student list, results, and details
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search student by name, roll, phone, email"
                  className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 placeholder:text-gray-500 w-full sm:w-72"
                />

                <button
                  onClick={() => setShowForm((v) => !v)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  + Add Student
                </button>
              </div>
            </div>

            {classes.length > 0 && (
              <AnimatedCard>
                <div className="flex flex-col gap-3">
                  <span className="text-sm md:text-base font-semibold text-gray-100">
                    View Students by Class
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {classes.map((className) => {
                      const isActive = selectedClass === className;
                      return (
                        <button
                          key={className}
                          type="button"
                          onClick={() => setSelectedClass(className)}
                          className={`px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold transition-all border ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white border-transparent shadow-lg shadow-blue-500/40 scale-[1.02]'
                              : 'bg-gray-800/90 text-gray-200 border-gray-700 hover:bg-gray-700 hover:border-gray-500'
                          }`}
                        >
                          {className}
                        </button>
                      );
                    })}
                  </div>

                  {selectedClass && (
                    <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
                      <p className="text-xs text-gray-400">
                        Showing students for class{' '}
                        <span className="font-semibold text-gray-200">
                          {selectedClass}
                        </span>
                      </p>

                      <button
                        type="button"
                        onClick={handleDeleteAllInClass}
                        className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-xs md:text-sm font-semibold text-white shadow-md"
                      >
                        Delete all students in this class (admin password)
                      </button>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            )}

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

            {!students.length && !showForm && (
              <div className="text-center py-16 text-gray-400">
                No students found. Click Add Student.
              </div>
            )}

            {!!students.length && filteredStudents.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No students match your search in this class.
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student, index) => {
                const createdAtDate = student.createdAt
                  ? new Date(student.createdAt)
                  : null;
                const createdBS = createdAtDate
                  ? adToBSFormatted(createdAtDate)
                  : '';
                const relative = createdAtDate
                  ? getRelativeTimeFromNow(createdAtDate)
                  : '';

                const isEditing = editingStudentId === student._id;

                return (
                  <motion.div
                    key={student._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AnimatedCard>
                      {!isEditing && (
                        <>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-lg font-bold text-white">
                              {student.name}
                            </h3>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(student)}
                              className="text-xs px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700"
                            >
                              Edit
                            </button>
                          </div>

                          <div className="text-sm text-gray-300 space-y-1 mt-2">
                            <p>🎯 Roll: {student.rollNumber}</p>
                            <p>📧 {student.email}</p>
                            <p>📱 {student.phone}</p>
                            <p>🏫 Class {student.className}</p>
                            {createdAtDate && (
                              <p className="pt-1 text-xs text-gray-400">
                                Created: {createdBS || '-'}{' '}
                                {relative && (
                                  <span className="text-gray-500">
                                    ({relative})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => handleDeleteStudent(student._id)}
                            className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {isEditing && (
                        <div className="space-y-3">
                          <h3 className="text-lg font-bold text-white">
                            Edit Student
                          </h3>

                          <input
                            type="text"
                            value={editFormData.name}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                            placeholder="Full Name"
                          />

                          <input
                            type="email"
                            value={editFormData.email}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                            placeholder="Email"
                          />

                          <input
                            type="text"
                            value={editFormData.rollNumber}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                rollNumber: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                            placeholder="Roll Number"
                          />

                          <input
                            type="tel"
                            value={editFormData.phone}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                phone: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                            placeholder="Phone"
                          />

                          <input
                            type="text"
                            value={editFormData.className}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                className: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                            placeholder="Class Name"
                          />

                          <div className="flex gap-3 pt-2">
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="flex-1 border border-gray-600 px-4 py-2 rounded-lg text-sm text-white hover:bg-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </AnimatedCard>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}