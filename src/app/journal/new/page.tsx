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

type EntryType = 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
type EntryMood = 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
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

const moods: { value: EntryMood; emoji: string; label: string }[] = [
  { value: 'CONFIDENT', emoji: '😊', label: 'Confident' },
  { value: 'NERVOUS', emoji: '😰', label: 'Nervous' },
  { value: 'EXCITED', emoji: '🚀', label: 'Excited' },
  { value: 'UNCERTAIN', emoji: '🤔', label: 'Uncertain' },
  { value: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
];

const convictionLevels: ConvictionLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

export default function NewEntryPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const [entryType, setEntryType] = useState<EntryType>('TRADE_IDEA');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<EntryMood>('NEUTRAL');
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
      entryType,
      content,
      mood,
      conviction,
      ticker: selectedTicker,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem('journal-draft', JSON.stringify(draft));
  }, [entryType, content, mood, conviction, selectedTicker]);

  // Load draft from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('journal-draft');
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        // Only load if it's less than 24 hours old
        const draftAge = Date.now() - new Date(draft.timestamp).getTime();
        if (draftAge < 24 * 60 * 60 * 1000) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="hover:bg-gray-100 min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">New Entry</h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Entry Type Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Entry Type</Label>
          <div className="flex flex-wrap gap-2">
            {entryTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setEntryType(type.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all min-h-[44px] ${
                  entryType === type.value
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-6">
          <Label htmlFor="content" className="text-sm font-medium mb-3 block">
            What&apos;s on your mind?
          </Label>
          <Textarea
            id="content"
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, analysis, or observations..."
            className="min-h-[200px] text-base resize-none focus:min-h-[300px] transition-all"
            autoCapitalize="sentences"
          />
          <p className="text-xs text-gray-600 mt-2">
            {content.length} characters
          </p>
        </div>

        {/* Mood Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">How are you feeling?</Label>
          <div className="flex flex-wrap gap-2">
            {moods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                className={`px-4 py-2 rounded-lg border-2 transition-all flex items-center gap-2 min-h-[44px] ${
                  mood === m.value
                    ? 'border-primary bg-primary text-primary-foreground font-medium'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <span className="text-xl" role="img" aria-label={m.label}>{m.emoji}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conviction Level */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Conviction Level</Label>
          <div className="flex gap-2">
            {convictionLevels.map((level) => (
              <button
                key={level}
                onClick={() => setConviction(level)}
                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium min-h-[44px] ${
                  conviction === level
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Ticker (Optional) */}
        <div className="mb-6">
          <Label htmlFor="ticker" className="text-sm font-medium mb-3 block">
            Ticker Symbol (Optional)
          </Label>
          {selectedTicker ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2 font-mono">
                {selectedTicker}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearTicker}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                className="text-base"
                autoCapitalize="characters"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.symbol}
                      onClick={() => handleTickerSelect(suggestion.symbol)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg min-h-[44px]"
                    >
                      <div className="font-medium">{suggestion.symbol}</div>
                      <div className="text-sm text-gray-500">{suggestion.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Fixed Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            size="lg"
            className="w-full h-14 text-lg font-medium"
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
    </div>
  );
}
