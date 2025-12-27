'use client';

import { useState } from 'react';
import { Type, Mic, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickCapture } from '@/components/QuickCapture';

interface CaptureButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

function CaptureButton({ icon, label, onClick, className }: CaptureButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styling
        'flex flex-col items-center justify-center gap-2',
        'p-4 rounded-xl',
        'min-h-[100px] w-full',

        // Colors - dark blue card with border
        'bg-slate-800 dark:bg-slate-800',
        'border border-slate-700 dark:border-slate-600',

        // Interaction
        'transition-all duration-200',
        'hover:bg-slate-700 dark:hover:bg-slate-700',
        'hover:border-slate-600 dark:hover:border-slate-500',
        'active:scale-[0.98]',

        className
      )}
    >
      <div className="p-3 rounded-lg bg-amber-500">
        {icon}
      </div>
      <span className="text-sm font-medium text-white">
        {label}
      </span>
    </button>
  );
}

type CaptureMode = 'text' | 'voice' | 'photo' | null;

export function CaptureButtons({ className }: { className?: string }) {
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [initialMode, setInitialMode] = useState<CaptureMode>(null);

  const openCapture = (mode: CaptureMode) => {
    setInitialMode(mode);
    setIsQuickCaptureOpen(true);
  };

  return (
    <>
      <div className={cn('grid grid-cols-3 gap-3', className)}>
        <CaptureButton
          icon={<Type className="h-6 w-6 text-white" />}
          label="Text"
          onClick={() => openCapture('text')}
        />
        <CaptureButton
          icon={<Mic className="h-6 w-6 text-white" />}
          label="Voice"
          onClick={() => openCapture('voice')}
        />
        <CaptureButton
          icon={<Camera className="h-6 w-6 text-white" />}
          label="Photo"
          onClick={() => openCapture('photo')}
        />
      </div>

      <QuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => {
          setIsQuickCaptureOpen(false);
          setInitialMode(null);
        }}
        initialMode={initialMode}
      />
    </>
  );
}
