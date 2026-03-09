
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store';
import { toggleSidebar } from '@/store/uiSlice';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Students', href: '/students', icon: '👥' },
  { label: 'Attendance', href: '/attendance', icon: '✅' },
  { label: 'Reports', href: '/reports', icon: '📈' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();

  const isOpen = useSelector(
    (state: RootState) => state.ui.sidebarOpen
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="
        hidden md:flex
        bg-gray-900 border-r border-gray-800
        h-screen sticky top-0 z-40 flex-col
        "
        animate={{ width: isOpen ? 260 : 80 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="m-3 p-2 rounded-lg hover:bg-gray-800 text-white"
        >
          {isOpen ? '←' : '→'}
        </button>

        <div className="flex-1 px-2 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>

                  {isOpen && (
                    <span className="font-medium">
                      {item.label}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="md:hidden fixed inset-0 bg-black/60 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(toggleSidebar())}
            />

            {/* Drawer */}
            <motion.div
              className="md:hidden fixed left-0 top-0 h-full w-72 bg-gray-900 z-50 p-4"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.25 }}
            >
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="mb-6 text-white text-xl"
              >
                ✕ Close
              </button>

              <div className="space-y-2">
                {menuItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800'
                        }
                        `}
                        onClick={() => dispatch(toggleSidebar())}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}