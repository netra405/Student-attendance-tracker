'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      setSuccess('If an account exists, a reset code has been sent.');
      setStep('reset');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccess('Password reset successful. Redirecting to login...');

      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='w-full max-w-md'
      >
        <motion.div
          variants={containerVariants}
          initial='hidden'
          animate='visible'
          className='bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8'
        >
          <motion.div variants={itemVariants} className='text-center mb-8'>
            <h1 className='text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              🔑 Forgot Password
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              {step === 'request'
                ? 'Enter your email to receive a reset code'
                : 'Enter the code and a new password'}
            </p>
          </motion.div>

          {error && (
            <motion.div
              variants={itemVariants}
              className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4'
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              variants={itemVariants}
              className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4'
            >
              {success}
            </motion.div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className='space-y-4'>
              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Email
                </label>
                <input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='your@email.com'
                  required
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={loading}
                className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50'
              >
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </motion.button>
            </form>
          ) : (
            <form onSubmit={handleReset} className='space-y-4'>
              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Reset Code
                </label>
                <input
                  type='text'
                  value={code}
                  onChange={(e) => setCode(e.target.value.slice(0, 6))}
                  maxLength={6}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='6-digit code'
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  New Password
                </label>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='At least 6 characters'
                  required
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={loading}
                className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50'
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </motion.button>
            </form>
          )}

          <motion.div variants={itemVariants} className='text-center mt-6'>
            <p className='text-gray-600 dark:text-gray-400'>
              Remembered your password?{' '}
              <Link href='/login' className='text-blue-600 hover:underline font-semibold'>
                Back to sign in
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

