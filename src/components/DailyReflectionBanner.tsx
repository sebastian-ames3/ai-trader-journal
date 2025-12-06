'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mic, Pencil, Clock, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarketCondition {
  spyChange: number;
  vixLevel: number;
  marketState: 'UP' | 'DOWN' | 'FLAT' | 'VOLATILE';
}

interface DailyReflectionBannerProps {
  className?: string;
}

export default function DailyReflectionBanner({ className }: DailyReflectionBannerProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [marketCondition, setMarketCondition] = useState<MarketCondition | null>(null);

  // Check if we should show the banner
  useEffect(() => {
    // Check localStorage for dismissal
    const dismissedToday = localStorage.getItem('dailyReflectionDismissed');
    if (dismissedToday) {
      const dismissedDate = new Date(dismissedToday);
      const today = new Date();
      // If dismissed today, don't show
      if (
        dismissedDate.getDate() === today.getDate() &&
        dismissedDate.getMonth() === today.getMonth() &&
        dismissedDate.getFullYear() === today.getFullYear()
      ) {
        return;
      }
    }

    // Check time - only show after 3:30 PM ET on weekdays
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      weekday: 'short',
    });

    const etParts = etFormatter.formatToParts(now);
    const hour = parseInt(etParts.find(p => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(etParts.find(p => p.type === 'minute')?.value || '0', 10);
    const dayOfWeek = etParts.find(p => p.type === 'weekday')?.value;

    // Only show on weekdays after 3:30 PM ET
    const isWeekday = !['Sat', 'Sun'].includes(dayOfWeek || '');
    const isAfterMarket = hour >= 15 && (hour > 15 || minute >= 30);

    if (isWeekday && isAfterMarket) {
      setIsVisible(true);
      fetchMarketCondition();
    }
  }, []);

  // Fetch market condition from API
  const fetchMarketCondition = async () => {
    try {
      const response = await fetch('/api/market-condition');
      if (response.ok) {
        const data = await response.json();
        setMarketCondition(data);
      }
    } catch (error) {
      console.error('Failed to fetch market condition:', error);
    }
  };

  // Handle dismiss
  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('dailyReflectionDismissed', new Date().toISOString());
    setTimeout(() => setIsVisible(false), 300);
  };

  // Handle quick capture
  const handleQuickCapture = () => {
    // Trigger FAB's QuickCapture modal via custom event
    window.dispatchEvent(new CustomEvent('openQuickCapture'));
    handleDismiss();
  };

  // Handle voice capture
  const handleVoiceCapture = () => {
    // Navigate to journal with voice mode
    router.push('/journal/new?mode=voice');
    handleDismiss();
  };

  if (!isVisible) return null;

  // Generate message based on market condition
  const getMessage = () => {
    if (!marketCondition) {
      return {
        title: "Market's closed",
        subtitle: '30 seconds to capture today\'s thoughts?',
        icon: Clock,
        iconColor: 'text-muted-foreground',
      };
    }

    const { spyChange, vixLevel, marketState } = marketCondition;

    if (marketState === 'VOLATILE' || vixLevel >= 25) {
      return {
        title: `Volatile day (VIX ${vixLevel.toFixed(0)})`,
        subtitle: 'How are you feeling about your positions?',
        icon: AlertTriangle,
        iconColor: 'text-amber-500',
      };
    }

    if (spyChange <= -2) {
      return {
        title: `Tough day (SPY ${spyChange.toFixed(1)}%)`,
        subtitle: 'This is when journals are most valuable',
        icon: TrendingDown,
        iconColor: 'text-red-500',
      };
    }

    if (spyChange >= 2) {
      return {
        title: `Great day (SPY +${spyChange.toFixed(1)}%)`,
        subtitle: 'Feeling euphoric? Worth noting',
        icon: TrendingUp,
        iconColor: 'text-green-500',
      };
    }

    return {
      title: "Market's closed",
      subtitle: '30 seconds to capture today\'s thoughts?',
      icon: Clock,
      iconColor: 'text-muted-foreground',
    };
  };

  const message = getMessage();
  const Icon = message.icon;

  return (
    <div
      className={cn(
        'fixed top-16 left-0 right-0 z-40 mx-4 sm:mx-auto sm:max-w-xl transition-all duration-300',
        isDismissed ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0',
        className
      )}
    >
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-full bg-muted', message.iconColor)}>
            <Icon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{message.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {message.subtitle}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8 -mt-1 -mr-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleVoiceCapture}
            className="flex-1 gap-2"
          >
            <Mic className="h-4 w-4" />
            Voice Note
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleQuickCapture}
            className="flex-1 gap-2"
          >
            <Pencil className="h-4 w-4" />
            Quick Text
          </Button>
        </div>

        {/* Snooze option */}
        <button
          onClick={handleDismiss}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground mt-3 py-1"
        >
          Skip today
        </button>
      </div>
    </div>
  );
}
