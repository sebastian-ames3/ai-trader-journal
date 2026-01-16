'use client';

import { useEffect, useState } from 'react';

interface TipConfig {
  id: string;
  message: string;
  showAfter?: number; // ms delay before showing
}

export function useOnboardingTips(entryCount: number) {
  const [currentTip, setCurrentTip] = useState<TipConfig | null>(null);

  const tips: TipConfig[] = [
    {
      id: 'tip-first-entry',
      message: 'Journal right after market close for best recall of your mindset',
      showAfter: 1000
    },
    {
      id: 'tip-ai-analysis',
      message: 'AI analysis runs automatically on your entries to detect patterns',
      showAfter: 5000
    },
    {
      id: 'tip-weekly-insights',
      message: 'Check Weekly Insights every Sunday to see your behavioral patterns',
      showAfter: 10000
    }
  ];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Show tips based on entry count
    if (entryCount === 1) {
      // First entry just created - show first tip
      setCurrentTip(tips[0]);
    } else if (entryCount === 2) {
      // Second entry - show AI analysis tip
      setCurrentTip(tips[1]);
    } else if (entryCount === 5) {
      // Fifth entry - show insights tip
      setCurrentTip(tips[2]);
    }
    // tips array is a stable constant defined outside component, intentionally excluded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryCount]);

  return currentTip;
}

// Utility to reset all dismissed tips (for testing)
export function resetOnboardingTips() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('dismissedTips');
  }
}
