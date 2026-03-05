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
      <div className='flex'>
        <Sidebar />
        <div className='flex-1'>
          <div className="bg-gray-900 min-h-screen">
            <div className='max-w-4xl mx-auto p-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className='mb-8'
              >
                <h1 className="text-4xl font-bold text-white">
                  Admin Settings
                </h1>
                <p className="mt-2 text-gray-300">
                  Manage your account details and security
                </p>
              </motion.div>

      {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6'
                >
                  {error}
                </motion.div>
              )}

      {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
              className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6'
                >
                  {success}
                </motion.div>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Change Email */}
                <AnimatedCard>
                  <h2 className="text-xl font-bold mb-4 text-white">
                    ✉️ Change Email
                  </h2>

                  {verification.step === 'verify' &&
                  verification.action === 'change-email' ? (
                    <form onSubmit={handleVerifyEmail} className='space-y-4'>
                      <p className="text-sm text-gray-300">
                        Enter the verification code sent to your new email
                      </p>
                      <input
                        type='text'
                        value={verificationCode}
                        onChange={(e) =>
                          setVerificationCode(e.target.value.slice(0, 6))
                        }
                        maxLength={6}
                        className="w-full px-4 py-2 border rounded-lg text-center text-2xl tracking-widest bg-gray-800 border-gray-700 text-gray-100"
                        placeholder='000000'
                        required
                      />
                      <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50'
                      >
                        {loading ? 'Verifying...' : 'Verify Email'}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleChangeEmail} className='space-y-4'>
                      <input
                        type='email'
                        value={emailForm.newEmail}
                        onChange={(e) =>
                          setEmailForm({ newEmail: e.target.value })
                        }
                        className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-gray-100"
                        placeholder='New email address'
                        required
                      />
                      <p className="text-sm text-gray-300">
                        Current: {session?.user?.email}
                      </p>
                      <button
                        type='submit'
                        disabled={loading}
                        className='w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50'
                      >
                        {loading ? 'Sending code...' : 'Change Email'}
                      </button>
                    </form>
                  )}
                </AnimatedCard>

                {/* Change Password */}
                <AnimatedCard>
                  <h2 className="text-xl font-bold mb-4 text-white">
                    🔐 Change Password
                  </h2>
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
                      className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-gray-100"
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
                      className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-gray-100"
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
                      className="w-full px-4 py-2 border rounded-lg bg-gray-800 border-gray-700 text-gray-100"
                      placeholder='Confirm new password'
                      required
                    />
                    <button
                      type='submit'
                      disabled={loading}
                      className='w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50'
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </button>
                  </form>
                </AnimatedCard>

                {/* Forgot Password helper */}
                <AnimatedCard>
                  <h2 className="text-xl font-bold mb-4 text-white">
                    ❓ Forgot Password
                  </h2>
                  <p className="text-sm text-gray-300 mb-4">
                    If you ever forget your admin password, you can reset it
                    using the email‑based reset flow.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/forgot-password')}
                    className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
                  >
                    Go to Forgot Password
                  </button>
                </AnimatedCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
