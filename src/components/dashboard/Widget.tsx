'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Settings, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WidgetSize } from './DashboardGrid';

export interface WidgetProps {
  id: string;
  isEditMode: boolean;
  size: WidgetSize;
  children: React.ReactNode;
  onRemove?: () => void;
  onSizeChange?: (size: WidgetSize) => void;
  onSettingsChange?: (settings: Record<string, unknown>) => void;
  className?: string;
}

export function Widget({
  id,
  isEditMode,
  size,
  children,
  onRemove,
  onSizeChange,
  onSettingsChange,
  className,
}: WidgetProps) {
  const [showSettings, setShowSettings] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !isEditMode });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSizeToggle = () => {
    if (!onSizeChange) return;

    // Cycle through sizes
    const sizes: WidgetSize[] = ['small', 'medium', 'large', 'full'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    onSizeChange(sizes[nextIndex]);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative h-full',
        'bg-white dark:bg-slate-800/50',
        'rounded-2xl',
        'border border-slate-200/50 dark:border-slate-700/50',
        'shadow-sm',
        'transition-all duration-200',
        'overflow-hidden',
        isDragging && 'opacity-50 ring-2 ring-amber-500 shadow-lg',
        isEditMode && 'ring-1 ring-slate-300 dark:ring-slate-600',
        className
      )}
      aria-label={`Widget ${id}`}
    >
      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 z-10 bg-slate-900/5 dark:bg-slate-900/20 rounded-2xl pointer-events-none" />
      )}

      {/* Widget Header (Edit Mode) */}
      {isEditMode && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-2 bg-slate-100/90 dark:bg-slate-700/90 backdrop-blur-sm rounded-t-2xl">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'p-2 rounded-lg',
              'bg-slate-200/80 dark:bg-slate-600/80',
              'hover:bg-amber-100 hover:text-amber-600',
              'dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
              'cursor-grab active:cursor-grabbing',
              'transition-colors',
              'min-w-[44px] min-h-[44px] flex items-center justify-center'
            )}
            aria-label="Drag to reorder widget"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Size Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSizeToggle}
              className="min-h-[44px] min-w-[44px] p-2"
              aria-label="Change widget size"
            >
              {size === 'small' || size === 'medium' ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>

            {/* Settings */}
            {onSettingsChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="min-h-[44px] min-w-[44px] p-2"
                aria-label="Widget settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}

            {/* Remove */}
            {onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="min-h-[44px] min-w-[44px] p-2 text-destructive hover:bg-destructive/10"
                aria-label="Remove widget"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Widget Content */}
      <div
        className={cn(
          'h-full p-4',
          isEditMode && 'pt-16 pointer-events-none'
        )}
      >
        {children}
      </div>

      {/* Placeholder for Edit Mode */}
      {isEditMode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-xs text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded">
            {size.charAt(0).toUpperCase() + size.slice(1)}
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton for loading widgets
export function WidgetSkeleton({ size = 'medium' }: { size?: WidgetSize }) {
  return (
    <div
      className={cn(
        'h-full',
        'bg-white dark:bg-slate-800/50',
        'rounded-2xl',
        'border border-slate-200/50 dark:border-slate-700/50',
        'p-4',
        'overflow-hidden'
      )}
    >
      <div className="space-y-3">
        <div className="h-5 w-24 skeleton rounded" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-3/4 skeleton rounded" />
        {(size === 'large' || size === 'full') && (
          <>
            <div className="h-4 w-5/6 skeleton rounded" />
            <div className="h-4 w-2/3 skeleton rounded" />
          </>
        )}
      </div>
    </div>
  );
}
