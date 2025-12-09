'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { GuidedEntryWizard } from '@/components/GuidedEntryWizard';
import { MoodSelector, MoodValue } from '@/components/ui/mood-selector';

type EntryType = 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
type ConvictionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface TickerResult {
  symbol: string;
  name: string;
}

const entryTypes: { value: EntryType; label: string }[] = [
  { value: 'TRADE_IDEA', label: 'Trade Idea' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];


const convictionLevels: ConvictionLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

type EntryMode = 'FREE_FORM' | 'GUIDED';

export default function NewEntryPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [mode, setMode] = useState<EntryMode>('FREE_FORM');
  const [entryType, setEntryType] = useState<EntryType>('TRADE_IDEA');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodValue>('NEUTRAL');
  const [conviction, setConviction] = useState<ConvictionLevel>('MEDIUM');
  const [tickerInput, setTickerInput] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TickerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Auto-focus on textarea when page loads
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const draft = {
      mode,
      entryType,
      content,
      mood,
      conviction,
      ticker: selectedTicker,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('journal-draft', JSON.stringify(draft));
  }, [mode, entryType, content, mood, conviction, selectedTicker]);

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('journal-draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // Only load if it's less than 24 hours old
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        if (draftAge < 24 * 60 * 60 * 1000) {
          setMode(draft.mode || 'FREE_FORM');
          setEntryType(draft.entryType || 'TRADE_IDEA');
          setContent(draft.content || '');
          setMood(draft.mood || 'NEUTRAL');
          setConviction(draft.conviction || 'MEDIUM');
          setSelectedTicker(draft.ticker || null);
        }
      } catch (e) {
        console.error('Error loading draft:', e);
      }
    }
  }, []);

  // Ticker search with debounce
  useEffect(() => {
    if (tickerInput.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/ticker?q=${tickerInput}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.results || []);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Failed to fetch ticker suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [tickerInput]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          content: content.trim(),
          mood,
          conviction,
          ticker: selectedTicker,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create entry');
      }

      const data = await response.json();

      // Show celebration toast if milestone reached
      if (data.streak?.celebrationMessage) {
        toast({
          title: data.streak.celebrationMessage,
          description: `Current streak: ${data.streak.currentStreak} days | Best: ${data.streak.longestStreak} days`,
          duration: 5000,
        });
      }

      // Clear draft
      localStorage.removeItem('journal-draft');

      // Navigate back to journal list
      router.push('/journal');
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  };

  const handleTickerSelect = (symbol: string) => {
    setSelectedTicker(symbol);
    setTickerInput(symbol);
    setShowSuggestions(false);
  };

  const clearTicker = () => {
    setSelectedTicker(null);
    setTickerInput('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">New Entry</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Mode Toggle */}
        <div className="mb-6">
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
            <button
              onClick={() => setMode('FREE_FORM')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                mode === 'FREE_FORM'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Free Form
            </button>
            <button
              onClick={() => setMode('GUIDED')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                mode === 'GUIDED'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Guided Entry
            </button>
          </div>
        </div>

        {mode === 'GUIDED' ? (
          <GuidedEntryWizard
            initialData={{
              entryType,
              content,
              // Cast to the limited mood type the wizard expects
              mood: mood as 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL',
              conviction,
              ticker: selectedTicker,
            }}
            onUpdate={(updates) => {
              if (updates.entryType !== undefined) setEntryType(updates.entryType);
              if (updates.content !== undefined) setContent(updates.content);
              if (updates.mood !== undefined) setMood(updates.mood);
              if (updates.conviction !== undefined) setConviction(updates.conviction);
              if (updates.ticker !== undefined) setSelectedTicker(updates.ticker);
            }}
            onSubmit={handleSubmit}
            onSwitchToFreeForm={() => setMode('FREE_FORM')}
            submitting={submitting}
          />
        ) : (
          <>

        {/* Entry Type Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">Entry Type</Label>
          <div className="flex flex-wrap gap-2">
            {entryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setEntryType(type.value)}
                className={`px-4 py-2 rounded-xl border-2 transition-all min-h-[44px] ${
                  entryType === type.value
                    ? 'border-amber-500 bg-amber-500 text-white font-medium shadow-md shadow-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6">
          <Label htmlFor="content" className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">
            What&apos;s on your mind?
          </Label>
          <Textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, analysis, or observations..."
            className="min-h-[200px] text-base resize-none focus:min-h-[300px] transition-all rounded-xl border-slate-200 dark:border-slate-700"
            autoCapitalize="sentences"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {content.length} characters
          </p>
        </div>

        {/* Mood Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">How are you feeling?</Label>
          <MoodSelector
            value={mood}
            onChange={setMood}
            variant="expanded"
            className="py-2"
          />
        </div>

        {/* Conviction Level */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">Conviction Level</Label>
          <div className="flex gap-2">
            {convictionLevels.map((level) => (
              <button
                key={level}
                onClick={() => setConviction(level)}
                className={`flex-1 px-4 py-3 rounded-xl border-2 transition-all font-medium min-h-[44px] ${
                  conviction === level
                    ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Ticker (Optional) */}
        <div className="mb-6">
          <Label htmlFor="ticker" className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">
            Ticker Symbol (Optional)
          </Label>
          {selectedTicker ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2 font-mono bg-slate-100 dark:bg-slate-800">
                {selectedTicker}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTicker}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
              >
                Clear
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Input
                id="ticker"
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value.toUpperCase())}
                placeholder="Search for ticker (e.g., AAPL)"
                className="text-base rounded-xl border-slate-200 dark:border-slate-700 min-h-[44px]"
                autoCapitalize="characters"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.symbol}
                      onClick={() => handleTickerSelect(suggestion.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 first:rounded-t-xl last:rounded-b-xl min-h-[44px]"
                    >
                      <div className="font-medium text-slate-900 dark:text-slate-200">{suggestion.symbol}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{suggestion.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-xl text-sm">
            {error}
          </div>
        )}
          </>
        )}
      </div>

      {/* Fixed Submit Button - Only show for Free Form mode */}
      {mode === 'FREE_FORM' && (
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 p-4 pb-safe shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            size="lg"
            className="w-full h-14 text-lg font-medium bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30"
          >
            {submitting ? (
              <>
                <Loader className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Entry'
            )}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
