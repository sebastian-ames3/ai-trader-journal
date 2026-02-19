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
        'flex flex-col items-center justify-center gap-2 p-4 rounded-xl min-h-[100px] w-full',
        // Light mode: clean white card
        'bg-white border border-slate-200/70 shadow-sm',
        // Dark mode: glassmorphic
        'dark:bg-card/60 dark:backdrop-blur-md',
        'dark:border dark:border-white/[0.07]',
        'dark:shadow-lg dark:shadow-black/30',
        // Hover
        'hover:shadow-md hover:border-slate-300/50',
        'dark:hover:bg-card/80 dark:hover:border-white/10',
        'transition-all duration-200 active:scale-[0.98]',
        className
      )}
    >
      <div className="p-3 rounded-lg bg-amber-500">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-800 dark:text-white">
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
