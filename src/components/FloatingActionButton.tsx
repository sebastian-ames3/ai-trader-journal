'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FloatingActionButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push('/journal/new')}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all active:scale-95 z-50 flex items-center justify-center md:bottom-8 md:right-8"
      aria-label="Create new journal entry"
    >
      <Plus className="h-6 w-6" />
    </button>
  );
}
