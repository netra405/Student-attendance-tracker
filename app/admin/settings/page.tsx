'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import AnimatedCard from '@/components/AnimatedCard';

interface VerificationState {
  step: 'idle' | 'verify';
  action: string;
  userId: string;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [emailForm, setEmailForm] = useState({
    newEmail: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [verification, setVerification] = useState<VerificationState>({
    step: 'idle',
    action: '',
    userId: '',
  });

  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-email',
          email: emailForm.newEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change email');
      }

      setVerification({
        step: 'verify',
        action: 'change-email',
        userId: data.userId,
      });
      setSuccess('Verification code sent. Check your new email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (passwordForm.newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const res = await fetch('/api/admin/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: verification.userId,
          code: verificationCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setSuccess('Email verified successfully!');
      setVerification({ step: 'idle', action: '', userId: '' });
      setVerificationCode('');
      setEmailForm({ newEmail: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen">
      <Navbar user={session?.user} />
      <div className='flex min-h-[calc(100vh-64px)]'>
        <Sidebar />
        <div className='flex-1 min-w-0'>
          <div className="bg-gray-900 min-h-full">
            <div className='max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='rounded-2xl border border-gray-800 bg-linear-to-r from-gray-900 via-gray-900 to-gray-800 p-6'
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-blue-400">
                      Security Center
                    </p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mt-1">
                      Admin Settings
                    </h1>
                    <p className="mt-2 text-gray-300 text-sm sm:text-base">
                      Manage login security, recovery options, and profile verification.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg border border-green-700/60 bg-green-900/20 px-3 py-2 text-green-300">
                      Email: {session?.user?.email ? 'Connected' : 'Not set'}
                    </div>
                    <div className="rounded-lg border border-blue-700/60 bg-blue-900/20 px-3 py-2 text-blue-300">
                      Auth: Password + OTP
                    </div>
                  </div>
                </div>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='bg-red-900/40 border border-red-700 text-red-100 px-4 py-3 rounded-xl'
                >
                  {error}
                </motion.div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='bg-green-900/40 border border-green-700 text-green-100 px-4 py-3 rounded-xl'
                >
                  {success}
                </motion.div>
              )}

              <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
                <div className="xl:col-span-2 space-y-6">
                  <AnimatedCard className="rounded-2xl border-gray-700/70">
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <h2 className="text-xl font-bold text-white">
                          Email & Verification
                        </h2>
                        <p className="text-sm text-gray-400 mt-1">
                          Update your login email and verify ownership with OTP.
                        </p>
                      </div>
                      <span className="rounded-full bg-blue-900/30 border border-blue-700/60 px-3 py-1 text-xs text-blue-300">
                        Recommended
                      </span>
                    </div>

                    {verification.step === 'verify' &&
                    verification.action === 'change-email' ? (
                      <form onSubmit={handleVerifyEmail} className='space-y-4'>
                        <p className="text-sm text-gray-300">
                          Enter the 6-digit verification code sent to your new email.
                        </p>
                        <input
                          type='text'
                          value={verificationCode}
                          onChange={(e) =>
                            setVerificationCode(e.target.value.slice(0, 6))
                          }
                          maxLength={6}
                          className="w-full px-4 py-3 border rounded-xl text-center text-2xl tracking-[0.35em] bg-gray-900 border-gray-700 text-gray-100"
                          placeholder='000000'
                          required
                        />
                        <button
                          type='submit'
                          disabled={loading}
                          className='w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium'
                        >
                          {loading ? 'Verifying...' : 'Verify New Email'}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleChangeEmail} className='space-y-4'>
                        <div className="rounded-xl border border-gray-700 bg-gray-900 p-3 text-sm text-gray-300">
                          Current email: <span className="text-white">{session?.user?.email}</span>
                        </div>
                        <input
                          type='email'
                          value={emailForm.newEmail}
                          onChange={(e) =>
                            setEmailForm({ newEmail: e.target.value })
                          }
                          className="w-full px-4 py-3 border rounded-xl bg-gray-900 border-gray-700 text-gray-100"
                          placeholder='New email address'
                          required
                        />
                        <button
                          type='submit'
                          disabled={loading}
                          className='w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium'
                        >
                          {loading ? 'Sending code...' : 'Send Verification Code'}
                        </button>
                      </form>
                    )}
                  </AnimatedCard>

                  <AnimatedCard className="rounded-2xl border-gray-700/70">
                    <h2 className="text-xl font-bold mb-1 text-white">
                      Password Security
                    </h2>
                    <p className="text-sm text-gray-400 mb-5">
                      Use a strong password and update it regularly.
                    </p>
                    <form onSubmit={handleChangePassword} className='space-y-4'>
                      <input
                        type='password'
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-xl bg-gray-900 border-gray-700 text-gray-100"
                        placeholder='Current password'
                        required
                      />
                      <input
                        type='password'
                        value={passwordForm.newPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            newPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-xl bg-gray-900 border-gray-700 text-gray-100"
                        placeholder='New password (min 6 chars)'
                        required
                      />
                      <input
                        type='password'
                        value={passwordForm.confirmPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 border rounded-xl bg-gray-900 border-gray-700 text-gray-100"
                        placeholder='Confirm new password'
                        required
                      />
                      <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 font-medium'
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </form>
                  </AnimatedCard>
                </div>

                <div className="space-y-6">
                  <AnimatedCard className="rounded-2xl border-gray-700/70">
                    <h2 className="text-lg font-semibold mb-3 text-white">
                      Account Recovery
                    </h2>
                    <p className="text-sm text-gray-300 mb-4">
                      If you forget the admin password, use email recovery to reset securely.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      className="w-full bg-purple-600 text-white py-2.5 rounded-xl hover:bg-purple-700"
                    >
                      Open Password Recovery
                    </button>
                  </AnimatedCard>

                  <AnimatedCard className="rounded-2xl border-gray-700/70">
                    <h2 className="text-lg font-semibold mb-3 text-white">
                      BS Calendar Data
                    </h2>
                    <p className="text-sm text-gray-300 mb-4">
                      Regenerate BS data or manually adjust month lengths for future year accuracy.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/admin/bs-calendar')}
                      className="w-full bg-indigo-600 text-white py-2.5 rounded-xl hover:bg-indigo-700"
                    >
                      Manage Calendar Dataset
                    </button>
                  </AnimatedCard>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
