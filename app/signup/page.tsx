'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

 const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    // ✅ Store userId safely
    if (!data.userId) {
      throw new Error('User ID not returned from server');
    }

    setUserId(data.userId);

    // Optional but smart (persist after refresh)
    localStorage.setItem('verifyUserId', data.userId);

    setSuccess('Verification code sent to your email');
    setStep('verify');

  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

 const handleVerify = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setSuccess('');
  setLoading(true);

  try {
    const storedUserId =
      userId || localStorage.getItem('verifyUserId');

    if (!storedUserId) {
      throw new Error('User session expired. Please sign up again.');
    }

    if (!verificationCode) {
      throw new Error('Please enter verification code');
    }

    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: storedUserId,
        code: verificationCode,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Verification failed');
    }

    // Cleanup
    localStorage.removeItem('verifyUserId');

    setSuccess('Email verified! Redirecting to login...');

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
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4'>
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
            <h1 className='text-4xl font-bold mb-2 bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              📚 Create Account
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              {step === 'signup'
                ? 'Set up your admin account'
                : 'Verify your email address'}
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

          {step === 'signup' ? (
            <form onSubmit={handleSignup} className='space-y-4'>
              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Full Name
                </label>
                <input
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='Your name'
                  required
                />
              </motion.div>

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

              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Password (min 6 characters)
                </label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='••••••'
                  required
                />
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Confirm Password
                </label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='••••••'
                  required
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={loading}
                className='w-full bg-linear-to-r from-blue-600 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50'
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </motion.button>

              <motion.div variants={itemVariants} className='text-center'>
                <p className='text-gray-600 dark:text-gray-400'>
                  Already have an account?{' '}
                  <Link href='/login' className='text-blue-600 hover:underline'>
                    Sign in
                  </Link>
                </p>
              </motion.div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className='space-y-4'>
              <motion.div variants={itemVariants}>
                <label className='block text-sm font-medium mb-2 dark:text-gray-300'>
                  Verification Code
                </label>
                <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                  Enter the 6-digit code sent to {email}
                </p>
                <input
                  type='text'
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.slice(0, 6).toUpperCase())
                  }
                  maxLength={6}
                  className='w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='000000'
                  required
                />
              </motion.div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='submit'
                disabled={loading}
                className='w-full bg-linear-to-r from-blue-600 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50'
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </motion.button>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type='button'
                onClick={() => setStep('signup')}
                className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all'
              >
                Back
              </motion.button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
