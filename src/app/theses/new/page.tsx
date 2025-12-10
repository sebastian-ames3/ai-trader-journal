'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ThesisDirection = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';

const DIRECTION_OPTIONS: Array<{
  value: ThesisDirection;
  label: string;
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
  description: string;
}> = [
  {
    value: 'BULLISH',
    label: 'Bullish',
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    description: 'Expecting price to rise',
  },
  {
    value: 'BEARISH',
    label: 'Bearish',
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
    description: 'Expecting price to fall',
  },
  {
    value: 'NEUTRAL',
    label: 'Neutral',
    icon: Minus,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700',
    description: 'Range-bound or sideways',
  },
  {
    value: 'VOLATILE',
    label: 'Volatile',
    icon: Activity,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    description: 'Expecting big move, direction unclear',
  },
];

export default function NewThesisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [direction, setDirection] = useState<ThesisDirection | null>(null);
  const [originalThesis, setOriginalThesis] = useState('');

  const isValid = name.trim() && ticker.trim() && direction && originalThesis.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/theses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ticker: ticker.trim().toUpperCase(),
          direction,
          originalThesis: originalThesis.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create thesis');
      }

      const thesis = await response.json();

      toast({
        title: 'Thesis created',
        description: `${thesis.name} has been created successfully.`,
        duration: 3000,
      });

      router.push(`/theses/${thesis.id}`);
    } catch (error) {
      console.error('Error creating thesis:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create thesis',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              New Trading Thesis
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Thesis Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., NVDA Bullish Q4, SPY Hedge Dec..."
              className="min-h-[44px]"
              autoFocus
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              A descriptive name for this trading thesis
            </p>
          </div>

          {/* Ticker */}
          <div className="space-y-2">
            <Label htmlFor="ticker" className="text-sm font-medium">
              Ticker Symbol
            </Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="e.g., NVDA, SPY, TSLA..."
              className="min-h-[44px] font-mono"
              maxLength={10}
            />
          </div>

          {/* Direction */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Direction</Label>
            <div className="grid grid-cols-2 gap-3">
              {DIRECTION_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = direction === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setDirection(option.value)}
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all min-h-[80px]',
                      isSelected
                        ? option.bgColor + ' border-current ' + option.color
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={cn('h-4 w-4', isSelected ? option.color : 'text-slate-400')} />
                      <span className={cn('font-medium', isSelected ? option.color : 'text-slate-900 dark:text-slate-100')}>
                        {option.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Original Thesis */}
          <div className="space-y-2">
            <Label htmlFor="thesis" className="text-sm font-medium">
              Your Thesis
            </Label>
            <Textarea
              id="thesis"
              value={originalThesis}
              onChange={(e) => setOriginalThesis(e.target.value)}
              placeholder="Write your trading thesis... What's your conviction? What's the catalyst? What are the risks? When would you be wrong?"
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your original thinking for this trade. This helps track how your thesis evolves.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full min-h-[48px] text-base"
            >
              {isSubmitting ? 'Creating...' : 'Create Thesis'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
