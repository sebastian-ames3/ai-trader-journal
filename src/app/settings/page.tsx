'use client';

import { ArrowLeft, Bell, Palette, Layout, Moon, Sun, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PushNotificationSetup from '@/components/PushNotificationSetup';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Settings
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Get notified about market conditions and journaling reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PushNotificationSetup showLabel={true} />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              Enable push notifications to receive alerts when the market is volatile or when you haven&apos;t journaled in a while.
            </p>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose your preferred theme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('light')}
                className={cn(
                  'min-h-[44px] gap-2 flex-1',
                  theme === 'light' && 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                <Sun className="h-4 w-4" />
                Light
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('dark')}
                className={cn(
                  'min-h-[44px] gap-2 flex-1',
                  theme === 'dark' && 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                <Moon className="h-4 w-4" />
                Dark
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme('system')}
                className={cn(
                  'min-h-[44px] gap-2 flex-1',
                  theme === 'system' && 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                <Monitor className="h-4 w-4" />
                System
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Customization Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Customize your dashboard layout and widgets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button variant="outline" className="min-h-[44px] w-full">
                Customize Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-slate-500 dark:text-slate-400 pt-4">
          <p>AI Trader Journal v1.0</p>
          <p className="mt-1">Built with Next.js & Claude AI</p>
        </div>
      </div>
    </div>
  );
}
