'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader, Trash2, X, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MoodSelector, MoodValue } from '@/components/ui/mood-selector';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Entry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' | null;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ticker: string | null;
  aiTags: string[];
  sentiment: string | null;
  detectedBiases: string[];
  createdAt: string;
  updatedAt: string;
}

type ConvictionLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type EntryType = 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';

const CONVICTION_LEVELS: ConvictionLevel[] = ['LOW', 'MEDIUM', 'HIGH'];
const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: 'TRADE_IDEA', label: 'Trade Idea' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];

// AI tag taxonomy for suggestions
const AI_TAG_TAXONOMY = [
  // Trade Type/Strategy
  'long-call', 'long-put', 'spreads', 'iron-condor', 'covered-call',
  // Market View
  'bullish', 'bearish', 'neutral', 'high-volatility', 'low-volatility',
  // Entry Catalyst
  'technical-analysis', 'chart-pattern', 'earnings-play', 'macro-event', 'news-catalyst',
  // Psychological State
  'disciplined', 'patient', 'emotional', 'fomo', 'revenge-trading',
  // Risk Assessment
  'defined-risk', 'position-sized', 'stop-loss-planned', 'hedged',
];

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params?.id as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [content, setContent] = useState('');
  const [type, setType] = useState<EntryType>('OBSERVATION');
  const [mood, setMood] = useState<MoodValue | null>(null);
  const [conviction, setConviction] = useState<ConvictionLevel | null>(null);
  const [ticker, setTicker] = useState('');
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Fetch entry data
  useEffect(() => {
    const fetchEntry = async () => {
      if (!entryId) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/entries/${entryId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Entry not found');
            return;
          }
          throw new Error('Failed to load entry');
        }

        const data = await response.json();
        setEntry(data);

        // Initialize form state
        setContent(data.content || '');
        setType(data.type || 'OBSERVATION');
        setMood(data.mood || null);
        setConviction(data.conviction || null);
        setTicker(data.ticker || '');
        setAiTags(data.aiTags || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entry');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEntry();
  }, [entryId]);

  // Check for unsaved changes
  const hasChanges = entry && (
    content !== entry.content ||
    type !== entry.type ||
    mood !== entry.mood ||
    conviction !== entry.conviction ||
    ticker !== (entry.ticker || '') ||
    JSON.stringify(aiTags) !== JSON.stringify(entry.aiTags || [])
  );

  // Save entry
  const handleSave = async () => {
    if (!entry || !content.trim()) {
      toast({
        title: 'Error',
        description: 'Content cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          type,
          mood,
          conviction,
          ticker: ticker.trim() || null,
          aiTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const updatedEntry = await response.json();
      setEntry(updatedEntry);

      toast({
        title: 'Changes saved',
        description: 'Your entry has been updated.',
      });

      router.push(`/journal/${entryId}`);
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete entry
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      toast({
        title: 'Entry deleted',
        description: 'The entry has been permanently deleted.',
      });

      router.push('/journal');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete entry',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Re-analyze entry with AI
  const handleAnalyze = async () => {
    if (!content.trim()) {
      toast({
        title: 'Error',
        description: 'Add content before analyzing',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);

    try {
      const response = await fetch(`/api/entries/${entryId}/analyze`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to analyze entry');
      }

      const result = await response.json();

      // Update local state with analysis results
      if (result.aiTags) {
        setAiTags(result.aiTags);
      }

      toast({
        title: 'Analysis complete',
        description: 'AI tags have been updated based on your content.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to analyze entry',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add a new tag
  const handleAddTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');
    if (normalizedTag && !aiTags.includes(normalizedTag)) {
      setAiTags([...aiTags, normalizedTag]);
    }
    setNewTag('');
    setShowTagSuggestions(false);
  };

  // Remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setAiTags(aiTags.filter(tag => tag !== tagToRemove));
  };

  // Filter tag suggestions
  const filteredSuggestions = AI_TAG_TAXONOMY.filter(
    tag => !aiTags.includes(tag) && tag.includes(newTag.toLowerCase())
  ).slice(0, 8);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || 'Entry not found'}</p>
        <Button variant="outline" onClick={() => router.push('/journal')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Journal
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (hasChanges) {
                if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
                  router.back();
                }
              } else {
                router.back();
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              {isDeleting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Edit Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Entry Type */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Entry Type</Label>
              <div className="flex flex-wrap gap-2">
                {ENTRY_TYPES.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={type === value ? 'default' : 'outline'}
                    className={cn(
                      'cursor-pointer transition-colors',
                      type === value
                        ? 'bg-amber-500 hover:bg-amber-600'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                    onClick={() => setType(value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content" className="text-sm font-medium mb-2 block">
                Content
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] text-base resize-none"
                placeholder="What's on your mind?"
              />
              <p className="text-xs text-gray-500 mt-2">{content.length} characters</p>
            </div>

            {/* Ticker */}
            <div>
              <Label htmlFor="ticker" className="text-sm font-medium mb-2 block">
                Ticker Symbol
              </Label>
              <input
                id="ticker"
                type="text"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full h-11 px-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-mono uppercase placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                placeholder="e.g., AAPL"
                maxLength={5}
              />
              <p className="text-xs text-gray-500 mt-2">
                Leave blank if no ticker applies. This is what shows as a badge on your entry.
              </p>
            </div>

            {/* Mood */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Mood</Label>
              <MoodSelector value={mood} onChange={setMood} variant="compact" />
            </div>

            {/* Conviction */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Conviction Level</Label>
              <div className="flex gap-2">
                {CONVICTION_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setConviction(conviction === level ? null : level)}
                    className={cn(
                      'flex-1 px-4 py-3 rounded-lg border-2 transition-all font-medium',
                      conviction === level
                        ? 'border-amber-500 bg-amber-500 text-white'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Tags */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">AI Tags</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Re-analyze
                    </>
                  )}
                </Button>
              </div>

              {/* Current Tags */}
              <div className="flex flex-wrap gap-2 mb-3">
                {aiTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1 gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {aiTags.length === 0 && (
                  <p className="text-sm text-gray-500">No tags yet. Add tags manually or click &quot;Re-analyze&quot; to generate them.</p>
                )}
              </div>

              {/* Add New Tag */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => {
                      setNewTag(e.target.value);
                      setShowTagSuggestions(e.target.value.length > 0);
                    }}
                    onFocus={() => setShowTagSuggestions(newTag.length > 0 || true)}
                    onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        e.preventDefault();
                        handleAddTag(newTag);
                      }
                    }}
                    className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                    placeholder="Add a tag..."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTag(newTag)}
                    disabled={!newTag.trim()}
                    className="h-10"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tag Suggestions Dropdown */}
                {showTagSuggestions && filteredSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddTag(suggestion);
                        }}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tags help categorize your entries for filtering and analysis.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
