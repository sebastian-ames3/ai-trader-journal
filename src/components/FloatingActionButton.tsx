'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuickCapture from './QuickCapture';
import { cn } from '@/lib/utils';

export default function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-95 z-40 flex items-center justify-center md:bottom-8 md:right-8',
          isOpen && 'opacity-0 pointer-events-none'
        )}
        aria-label="Quick capture new journal entry"
        aria-expanded={isOpen}
      >
        <Plus className="h-6 w-6" />
      </button>

      <QuickCapture isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
