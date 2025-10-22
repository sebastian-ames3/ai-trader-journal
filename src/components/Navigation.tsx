'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, BarChart3 } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const [streak, setStreak] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, [pathname]); // Refetch when navigating

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">
              AI Trader Journal
            </Link>

            {!loading && streak >= 2 && (
              <div className="flex items-center gap-1 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-sm font-medium">
                🔥 {streak} day{streak !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                isActive('/')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              <Home className="h-5 w-5" />
              <span className="hidden sm:inline">Home</span>
            </Link>

            <Link
              href="/journal"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                isActive('/journal')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              <span className="hidden sm:inline">Journal</span>
            </Link>

            <Link
              href="/insights"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors min-h-[44px] ${
                isActive('/insights')
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-gray-100'
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
