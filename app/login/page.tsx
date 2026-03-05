'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
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
            <h1 className='text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
              📚 AttendanceTracker
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>
              Manage student attendance with ease
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className='space-y-4'>
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
                Password
              </label>
              <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white'
                placeholder='••••••••'
                required
              />
            </motion.div>

            {error && (
              <motion.p
                variants={itemVariants}
                className='text-red-500 text-sm text-center'
              >
                {error}
              </motion.p>
            )}

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type='submit'
              disabled={loading}
              className='w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50'
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <motion.div variants={itemVariants} className='mt-4 text-right'>
            <Link
              href='/forgot-password'
              className='text-sm text-blue-600 hover:underline'
            >
              Forgot password?
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className='mt-6 space-y-3'
          >
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300 dark:border-gray-600'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white dark:bg-gray-800 text-gray-500'>
                  Or sign in with
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signIn('google')}
              className='w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all'
            >
              🔴 Google
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className='text-center mt-6'>
            <p className='text-gray-600 dark:text-gray-400'>
              Don't have an account?{' '}
              <Link href='/signup' className='text-blue-600 hover:underline font-semibold'>
                Create Admin Account
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
