

'use client';

import { useState, useEffect, useRef } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { toggleSidebar } from '@/store/uiSlice';

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function Navbar({ user }: { user?: User | null }) {

  const router = useRouter();
  const dispatch = useDispatch();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40 w-full"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">

        <div className="flex justify-between items-center h-16">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* Mobile Sidebar Toggle */}
            <button
              className="md:hidden text-white"
              onClick={() => dispatch(toggleSidebar())}
            >
              <Menu size={24} />
            </button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent truncate"
            >
              📚 AttendanceTracker
            </motion.div>
          </div>

          {/* PROFILE MENU (Desktop + Mobile Unified) */}
          <div className="relative" ref={dropdownRef}>

            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-100 transition"
            >
              {user?.image && (
                <img
                  src={user.image}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              )}

              <span className="text-sm sm:text-base font-medium truncate max-w-[120px]">
                {user?.name}
              </span>
            </motion.button>

            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-12 w-48 rounded-lg shadow-lg bg-gray-800 border border-gray-700 overflow-hidden z-50"
              >
                <button
                  onClick={() => {
                    router.push('/admin/settings');
                    setShowDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-100 transition"
                >
                  ⚙️ Settings
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 text-gray-100 transition"
                >
                  Logout
                </button>
              </motion.div>
            )}
          </div>

        </div>
      </div>
    </motion.nav>
  );
}