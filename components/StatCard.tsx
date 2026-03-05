'use client';

import { motion } from 'framer-motion';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

export default function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="bg-gray-800 border-gray-700 border rounded-lg p-6 text-gray-100"
    >
     <div className='flex items-center justify-between'>
        <div>
          <p className="text-sm text-gray-400">
            {label}
          </p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className='text-3xl font-bold mt-2'
          >
            {value}
          </motion.p>
        </div>
        <motion.div
          className={`text-5xl p-3 rounded-lg ${color} text-white`}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          {icon}
        </motion.div>
      </div> 
    </motion.div>
  );
}
