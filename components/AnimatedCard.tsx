'use client';

import { motion } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedCard({
  children,
  className = '',
  delay = 0,
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, boxShadow: '0 20px 25px rgba(0,0,0,0.5)' }}
      className={`bg-gray-800 border-gray-700 border rounded-lg p-6 transition-all ${className}`}
    >
      {children}
    </motion.div>
  );
}
