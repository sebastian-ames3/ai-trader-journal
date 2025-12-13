'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export default function Navigation() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Hide navigation on login page
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    // Don't fetch streak on login page
    if (isLoginPage) return;

    async function fetchStreak() {
      try {
        const response = await fetch('/api/streak');
        if (response.ok) {
          const data = await response.json();
          setStreak(data.currentStreak);
        }
      } catch (error) {
        console.error('Failed to fetch streak:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStreak();
  }, [pathname, isLoginPage]); // Refetch when navigating

  if (isLoginPage) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 hidden md:block">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              AI Trader Journal
            </Link>

            {!loading && streak >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 rounded-full text-sm font-medium">
                🔥 {streak} day{streak !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href="/journal"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/journal')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Journal</span>
            </Link>

            <Link
              href="/insights"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/insights')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Insights</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
