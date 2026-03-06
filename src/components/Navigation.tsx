'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3, TrendingUp, MessageSquare, Settings, Brain, Activity } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import GlobalSearch from './GlobalSearch';
import { cn } from '@/lib/utils';

export default function Navigation() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Hide navigation on public/unauthenticated pages
  const isPublicPage = pathname === '/login' || pathname === '/offline' || pathname?.startsWith('/share/');

  useEffect(() => {
    // Don't fetch streak on public pages
    if (isPublicPage) return;

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
  }, [pathname, isPublicPage]); // Refetch when navigating

  if (isPublicPage) {
    return null;
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    // Exact match for /insights so it doesn't highlight when on /insights/patterns
    if (path === '/insights') {
      return pathname === '/insights';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 hidden md:block">
      <div className={cn(
        "bg-white/90 dark:bg-card/70",
        "backdrop-blur-xl",
        "border-b border-slate-200/50 dark:border-white/[0.07]",
        "dark:shadow-lg dark:shadow-black/20"
      )}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-slate-900 dark:text-slate-100">
              AI Trader Journal
            </Link>

            {!loading && streak >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400 rounded-full text-sm font-medium">
                🔥 {streak} day{streak !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <GlobalSearch />
            <ThemeToggle />
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
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
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Journal</span>
            </Link>

            <Link
              href="/trades"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/trades')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span className="hidden sm:inline">Trades</span>
            </Link>

            <Link
              href="/theses"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/theses')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <TrendingUp className="h-5 w-5" />
              <span className="hidden sm:inline">Theses</span>
            </Link>

            <Link
              href="/insights"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/insights')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Insights</span>
            </Link>

            <Link
              href="/insights/patterns"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/insights/patterns')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Brain className="h-5 w-5" />
              <span className="hidden sm:inline">Patterns</span>
            </Link>

            <Link
              href="/coach"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/coach')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="hidden sm:inline">Coach</span>
            </Link>

            <Link
              href="/settings"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 min-h-[44px] ${
                isActive('/settings')
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
          </div>
        </div>
      </div>
      </div>
    </nav>
  );
}
