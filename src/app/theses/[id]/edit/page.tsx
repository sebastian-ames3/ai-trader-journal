'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Thesis {
  id: string;
  name: string;
  ticker: string;
  direction: string;
  originalThesis: string;
  status: string;
}

export default function EditThesisPage() {
  const router = useRouter();
  const params = useParams();
  const thesisId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [originalThesis, setOriginalThesis] = useState('');
  const [thesis, setThesis] = useState<Thesis | null>(null);

  // Fetch thesis data
  const fetchThesis = useCallback(async () => {
    try {
      const response = await fetch(`/api/theses/${thesisId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Thesis not found');
        }
        throw new Error('Failed to fetch thesis');
      }
      const data: Thesis = await response.json();

      setThesis(data);
      setName(data.name);
      setOriginalThesis(data.originalThesis);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [thesisId]);

  useEffect(() => {
    if (thesisId) {
      fetchThesis();
    }
  }, [thesisId, fetchThesis]);

  const isValid = name.trim() && originalThesis.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/theses/${thesisId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          originalThesis: originalThesis.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update thesis');
      }

      toast({
        title: 'Thesis updated',
        description: 'Your changes have been saved.',
        duration: 3000,
      });

      router.push(`/theses/${thesisId}`);
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400 dark:text-slate-600" />
      </div>
    );
  }

  if (error && !thesis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-semibold mb-2 dark:text-slate-100">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/theses')}>
            Back to Theses
          </Button>
        </div>
      </div>
    );
  }

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
              Edit Thesis
            </h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Ticker (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-500">
              Ticker Symbol
            </Label>
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-slate-600 dark:text-slate-400">
              {thesis?.ticker}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ticker cannot be changed after creation
            </p>
          </div>

          {/* Direction (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-500">
              Direction
            </Label>
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
              {thesis?.direction}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direction cannot be changed after creation
            </p>
          </div>

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

          {/* Original Thesis */}
          <div className="space-y-2">
            <Label htmlFor="thesis" className="text-sm font-medium">
              Your Thesis
            </Label>
            <Textarea
              id="thesis"
              value={originalThesis}
              onChange={(e) => setOriginalThesis(e.target.value)}
              placeholder="Write your trading thesis..."
              className="min-h-[200px] resize-y"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your original thinking for this trade
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full min-h-[48px] text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
