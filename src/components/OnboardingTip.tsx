'use client';

import { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OnboardingTipProps {
  tipId: string;
  title?: string;
  message: string;
  showDelay?: number; // milliseconds to wait before showing
  position?: 'top' | 'bottom';
}

export default function OnboardingTip({
  tipId,
  title = '💡 Tip',
  message,
  showDelay = 500,
  position = 'bottom'
}: OnboardingTipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Check if this tip has been dismissed before
    const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '[]');

    if (!dismissedTips.includes(tipId)) {
      // Show after delay
      const timer = setTimeout(() => {
        setShouldRender(true);
        // Add slight delay for animation
        setTimeout(() => setIsVisible(true), 50);
      }, showDelay);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [tipId, showDelay]);

  const handleDismiss = () => {
    setIsVisible(false);

    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setShouldRender(false);

      // Save dismissed state to localStorage
      const dismissedTips = JSON.parse(localStorage.getItem('dismissedTips') || '[]');
      if (!dismissedTips.includes(tipId)) {
        dismissedTips.push(tipId);
        localStorage.setItem('dismissedTips', JSON.stringify(dismissedTips));
      }
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`
        fixed z-50 left-0 right-0 px-4
        ${position === 'top' ? 'top-4' : 'bottom-20'}
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
      role="alert"
      aria-live="polite"
    >
      <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800 shadow-lg">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
                  {title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="min-h-[44px] min-w-[44px] p-0 flex-shrink-0 hover:bg-blue-100 dark:hover:bg-blue-900"
              aria-label="Dismiss tip"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
