'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Mic, Camera, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickCaptureWidgetProps {
  onOpenCapture?: () => void;
  className?: string;
}

export function QuickCaptureWidget({
  onOpenCapture,
  className,
}: QuickCaptureWidgetProps) {
  const router = useRouter();

  const handleQuickCapture = () => {
    if (onOpenCapture) {
      onOpenCapture();
    }
  };

  const handleNewEntry = () => {
    router.push('/journal/new');
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col',
        className
      )}
    >
      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
        Quick Capture
      </h3>

      <div className="flex-1 flex flex-col gap-2">
        {/* Main Quick Capture Button */}
        <Button
          onClick={handleQuickCapture}
          className={cn(
            'flex-1',
            'bg-gradient-to-br from-amber-500 to-orange-500',
            'hover:from-amber-600 hover:to-orange-600',
            'text-white',
            'rounded-xl',
            'min-h-[64px]',
            'gap-3',
            'text-base font-medium',
            'shadow-md hover:shadow-lg',
            'transition-all duration-200'
          )}
        >
          <Plus className="h-6 w-6" />
          Quick Capture
        </Button>

        {/* Secondary Actions */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            onClick={handleQuickCapture}
            className={cn(
              'flex-col gap-1 h-auto py-3',
              'min-h-[56px]',
              'rounded-xl',
              'hover:bg-amber-50 hover:border-amber-200',
              'dark:hover:bg-amber-900/20 dark:hover:border-amber-800'
            )}
            aria-label="Voice capture"
          >
            <Mic className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Voice</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleQuickCapture}
            className={cn(
              'flex-col gap-1 h-auto py-3',
              'min-h-[56px]',
              'rounded-xl',
              'hover:bg-amber-50 hover:border-amber-200',
              'dark:hover:bg-amber-900/20 dark:hover:border-amber-800'
            )}
            aria-label="Photo capture"
          >
            <Camera className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Photo</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleNewEntry}
            className={cn(
              'flex-col gap-1 h-auto py-3',
              'min-h-[56px]',
              'rounded-xl',
              'hover:bg-amber-50 hover:border-amber-200',
              'dark:hover:bg-amber-900/20 dark:hover:border-amber-800'
            )}
            aria-label="Full entry form"
          >
            <Pencil className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-slate-600 dark:text-slate-400">Full</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Skeleton for loading
export function QuickCaptureWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="h-4 w-24 skeleton rounded mb-3" />
      <div className="flex-1 skeleton rounded-xl" />
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="h-14 skeleton rounded-xl" />
        <div className="h-14 skeleton rounded-xl" />
        <div className="h-14 skeleton rounded-xl" />
      </div>
    </div>
  );
}
