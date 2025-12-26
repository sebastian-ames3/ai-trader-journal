'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MoodSelector, MoodValue } from '@/components/ui/mood-selector';

type EntryType = 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
type ConvictionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface TickerResult {
  symbol: string;
  name: string;
}

interface Entry {
  id: string;
  type: EntryType;
  content: string;
  mood: MoodValue | null;
  conviction: ConvictionLevel | null;
  ticker: string | null;
  createdAt: string;
  updatedAt: string;
}

const entryTypes: { value: EntryType; label: string }[] = [
  { value: 'TRADE_IDEA', label: 'Trade Idea' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];

const convictionLevels: ConvictionLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [entryType, setEntryType] = useState<EntryType>('TRADE_IDEA');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodValue>('NEUTRAL');
  const [conviction, setConviction] = useState<ConvictionLevel>('MEDIUM');
  const [tickerInput, setTickerInput] = useState('');
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<TickerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [entryDate, setEntryDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch entry data
  const fetchEntry = useCallback(async () => {
    try {
      const response = await fetch(`/api/entries/${entryId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Entry not found');
        }
        throw new Error('Failed to fetch entry');
      }
      const data: Entry = await response.json();

      // Populate form with existing data
      setEntryType(data.type);
      setContent(data.content);
      setMood(data.mood || 'NEUTRAL');
      setConviction(data.conviction || 'MEDIUM');
      setSelectedTicker(data.ticker);
      if (data.ticker) {
        setTickerInput(data.ticker);
      }
      // Set the entry date (format for datetime-local input)
      const date = new Date(data.createdAt);
      const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
      setEntryDate(localDate.toISOString().slice(0, 16));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    if (entryId) {
      fetchEntry();
    }
  }, [entryId, fetchEntry]);

  // Focus textarea after loading
  useEffect(() => {
    if (!loading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [loading]);

  // Ticker search with debounce
  useEffect(() => {
    if (tickerInput.length < 1 || tickerInput === selectedTicker) {
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
  }, [tickerInput, selectedTicker]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: entryType,
          content: content.trim(),
          mood,
          conviction,
          ticker: selectedTicker,
          createdAt: entryDate ? new Date(entryDate).toISOString() : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update entry');
      }

      toast({
        title: 'Entry updated',
        description: 'Your journal entry has been saved.',
        duration: 3000,
      });

      // Navigate back to entry detail
      router.push(`/journal/${entryId}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-slate-400 dark:text-slate-600" />
      </div>
    );
  }

  if (error && !content) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">Error</div>
          <h2 className="text-xl font-semibold mb-2 dark:text-slate-100">Error</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.push('/journal')}>
            Back to Journal
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit Entry</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
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

        {/* Entry Date */}
        <div className="mb-6">
          <Label htmlFor="entryDate" className="text-sm font-medium mb-3 block text-slate-700 dark:text-slate-200">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Entry Date & Time
            </span>
          </Label>
          <Input
            id="entryDate"
            type="datetime-local"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="text-base rounded-xl border-slate-200 dark:border-slate-700 min-h-[44px] max-w-xs"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Change when this entry was recorded
          </p>
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
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 p-4 pb-safe shadow-lg">
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
              'Save Changes'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
