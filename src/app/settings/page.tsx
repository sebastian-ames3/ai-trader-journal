'use client';

import { useState } from 'react';
import { ArrowLeft, Bell, Palette, Layout, Moon, Sun, Monitor, Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PushNotificationSetup from '@/components/PushNotificationSetup';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'json' | 'csv', type: string = 'all') => {
    setExporting(`${format}-${type}`);
    try {
      const response = await fetch(`/api/export?format=${format}&type=${type}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '')
        || `trader-journal-export.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

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

        {/* Data Export Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Export
            </CardTitle>
            <CardDescription>
              Download your journal data for backup or portability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Full Export */}
            <div>
              <p className="text-sm font-medium mb-2">Full Export (All Data)</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleExport('json', 'all')}
                  disabled={exporting !== null}
                  className="min-h-[44px] flex-1 gap-2"
                >
                  {exporting === 'json-all' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileJson className="h-4 w-4" />
                  )}
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleExport('csv', 'entries')}
                  disabled={exporting !== null}
                  className="min-h-[44px] flex-1 gap-2"
                >
                  {exporting === 'csv-entries' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Individual Exports */}
            <div>
              <p className="text-sm font-medium mb-2">Export by Category</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('csv', 'entries')}
                  disabled={exporting !== null}
                  className="min-h-[44px] justify-start"
                >
                  {exporting === 'csv-entries' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Entries (CSV)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('csv', 'theses')}
                  disabled={exporting !== null}
                  className="min-h-[44px] justify-start"
                >
                  {exporting === 'csv-theses' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Theses (CSV)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('csv', 'trades')}
                  disabled={exporting !== null}
                  className="min-h-[44px] justify-start"
                >
                  {exporting === 'csv-trades' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Trades (CSV)
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('csv', 'goals')}
                  disabled={exporting !== null}
                  className="min-h-[44px] justify-start"
                >
                  {exporting === 'csv-goals' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                  )}
                  Goals (CSV)
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              JSON includes all data in a single file. CSV exports are separated by category for spreadsheet compatibility.
            </p>
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
