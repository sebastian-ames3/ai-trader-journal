'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Loader, Link2, X, ChevronRight, ScanText, Mic, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TradeLinkSuggestions, { LinkSuggestion } from '@/components/entries/TradeLinkSuggestions';
import AudioPlayer from '@/components/AudioPlayer';
import { format } from 'date-fns';

interface LinkedTrade {
  id: string;
  description: string;
  openedAt: string;
  strategyType: string | null;
  thesis: {
    id: string;
    name: string;
    ticker: string;
  };
}

interface Entry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' | null;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ticker: string | null;
  thesisTradeId: string | null;
  thesisTrade: LinkedTrade | null;
  isOcrScanned?: boolean;
  ocrConfidence?: number;
  // Voice memo fields
  audioUrl?: string | null;
  audioDuration?: number | null;
  transcription?: string | null;
  captureMethod?: 'TEXT' | 'VOICE' | 'SCREENSHOT' | 'QUICK_CAPTURE' | 'JOURNAL_SCAN';
  createdAt: string;
  updatedAt: string;
}

const moodEmojis = {
  CONFIDENT: '😊',
  NERVOUS: '😰',
  EXCITED: '🚀',
  UNCERTAIN: '🤔',
  NEUTRAL: '😐',
};

const moodLabels = {
  CONFIDENT: 'Confident',
  NERVOUS: 'Nervous',
  EXCITED: 'Excited',
  UNCERTAIN: 'Uncertain',
  NEUTRAL: 'Neutral',
};

const typeColors = {
  TRADE_IDEA: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  TRADE: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  REFLECTION: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  OBSERVATION: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
};

const convictionColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  HIGH: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
};

export default function EntryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.id as string;

  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  // Voice memo state
  const [showTranscription, setShowTranscription] = useState(false);

  // Trade linking state
  const [showLinkPanel, setShowLinkPanel] = useState(false);
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [updatingLink, setUpdatingLink] = useState(false);

  const fetchEntry = useCallback(async () => {
    try {
      const response = await fetch(`/api/entries/${entryId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Entry not found');
        }
        throw new Error('Failed to fetch entry');
      }
      const data = await response.json();
      setEntry(data);
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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      router.push('/journal');
    } catch (err) {
      setError((err as Error).message);
      setDeleting(false);
    }
  };

  // Fetch link suggestions for the entry
  const fetchLinkSuggestions = useCallback(async () => {
    if (!entry) return;

    setLoadingSuggestions(true);
    try {
      // Extract tickers from content and ticker field
      const tickers: string[] = [];
      if (entry.ticker) tickers.push(entry.ticker);

      // Simple ticker extraction from content
      const tickerMatches = entry.content.match(/\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b(?=\s*(call|put|spread|option|trade|position))/gi);
      if (tickerMatches) {
        tickerMatches.forEach(match => {
          const ticker = match.replace('$', '').toUpperCase();
          if (!tickers.includes(ticker)) tickers.push(ticker);
        });
      }

      if (tickers.length === 0) {
        setLinkSuggestions([]);
        return;
      }

      const response = await fetch('/api/journal/link-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tickers,
          date: entry.createdAt,
          content: entry.content,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLinkSuggestions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch link suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [entry]);

  // Update the entry's trade link
  const handleLinkTrade = async (tradeId: string) => {
    setUpdatingLink(true);
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisTradeId: tradeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to link trade');
      }

      // Refresh entry data
      await fetchEntry();
      setShowLinkPanel(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingLink(false);
    }
  };

  // Remove the trade link
  const handleUnlinkTrade = async () => {
    if (!confirm('Remove the link to this trade?')) return;

    setUpdatingLink(true);
    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thesisTradeId: null }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlink trade');
      }

      // Refresh entry data
      await fetchEntry();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingLink(false);
    }
  };

  // Open link panel and fetch suggestions
  const handleOpenLinkPanel = () => {
    setShowLinkPanel(true);
    fetchLinkSuggestions();
  };

  // Format strategy type for display
  const formatStrategy = (type: string | null): string => {
    if (!type) return 'Trade';
    return type
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatEntryType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400 dark:text-gray-600" />
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold mb-2 dark:text-gray-100">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Entry not found'}</p>
          <Button onClick={() => router.push('/journal')}>
            Back to Journal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/journal/${entryId}/edit`)}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={`${typeColors[entry.type]} font-medium`}
                >
                  {formatEntryType(entry.type)}
                </Badge>
                {entry.ticker && (
                  <Badge variant="secondary" className="font-mono text-base px-3 py-1">
                    {entry.ticker}
                  </Badge>
                )}
              </div>
            </div>
            <CardTitle className="text-sm text-gray-500 dark:text-gray-400 font-normal">
              {formatDateTime(entry.createdAt)}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Main Content */}
            <div className="mb-6">
              <p className="text-lg leading-relaxed whitespace-pre-wrap dark:text-gray-200">
                {entry.content}
              </p>
            </div>

            {/* Voice Memo Section */}
            {entry.audioUrl && (
              <div className="mb-6 p-4 rounded-lg bg-muted/30 border">
                <div className="flex items-center gap-2 mb-3">
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Voice Memo</span>
                  {entry.audioDuration && (
                    <span className="text-xs text-muted-foreground">
                      ({Math.floor(entry.audioDuration / 60)}:{(entry.audioDuration % 60).toString().padStart(2, '0')})
                    </span>
                  )}
                </div>
                <AudioPlayer
                  src={entry.audioUrl}
                  duration={entry.audioDuration || undefined}
                />
                {entry.transcription && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={() => setShowTranscription(!showTranscription)}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${showTranscription ? 'rotate-180' : ''}`}
                      />
                      {showTranscription ? 'Hide' : 'Show'} Transcription
                    </button>
                    {showTranscription && (
                      <p className="mt-2 text-sm text-muted-foreground italic whitespace-pre-wrap">
                        &ldquo;{entry.transcription}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Metadata Section */}
            <div className="border-t dark:border-gray-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mood */}
                {entry.mood && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mood</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{moodEmojis[entry.mood]}</span>
                      <span className="font-medium dark:text-gray-200">{moodLabels[entry.mood]}</span>
                    </div>
                  </div>
                )}

                {/* Conviction */}
                {entry.conviction && (
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conviction</p>
                    <Badge
                      variant="outline"
                      className={`${convictionColors[entry.conviction]} text-base px-3 py-1`}
                    >
                      {entry.conviction}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Capture Method Indicators */}
              {(entry.isOcrScanned || entry.captureMethod === 'VOICE') && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t dark:border-gray-700 flex-wrap">
                  {entry.isOcrScanned && (
                    <Badge variant="outline" className="gap-1">
                      <ScanText className="h-3 w-3" />
                      OCR Scanned
                      {entry.ocrConfidence && (
                        <span className="text-muted-foreground ml-1">
                          ({Math.round(entry.ocrConfidence * 100)}% confidence)
                        </span>
                      )}
                    </Badge>
                  )}
                  {entry.captureMethod === 'VOICE' && (
                    <Badge variant="outline" className="gap-1">
                      <Mic className="h-3 w-3" />
                      Voice Memo
                    </Badge>
                  )}
                </div>
              )}

              {/* Updated timestamp if different from created */}
              {entry.updatedAt !== entry.createdAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Last updated: {formatDateTime(entry.updatedAt)}
                </p>
              )}
            </div>

            {/* Trade Link Section */}
            <div className="border-t dark:border-gray-700 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked Trade
                </h3>
              </div>

              {/* Current Link Display */}
              {entry.thesisTrade ? (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-primary/5 border-primary/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="font-mono">
                            {entry.thesisTrade.thesis.ticker}
                          </Badge>
                          <span className="font-medium text-sm">
                            {entry.thesisTrade.thesis.name}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {formatStrategy(entry.thesisTrade.strategyType)} • {entry.thesisTrade.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Opened: {format(new Date(entry.thesisTrade.openedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleOpenLinkPanel}
                        className="h-8 w-8"
                        aria-label="Change trade link"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-primary/10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/theses/${entry.thesisTrade!.thesis.id}`)}
                        className="flex-1"
                      >
                        View Thesis
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnlinkTrade}
                        disabled={updatingLink}
                        className="text-destructive hover:text-destructive"
                      >
                        {updatingLink ? <Loader className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!showLinkPanel ? (
                    <button
                      onClick={handleOpenLinkPanel}
                      className="w-full p-4 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700
                               hover:border-primary/50 hover:bg-primary/5 transition-colors text-center"
                    >
                      <Link2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Link to a Trade</p>
                      <p className="text-xs text-muted-foreground">
                        Connect this entry to a trade for better insights
                      </p>
                    </button>
                  ) : null}
                </div>
              )}

              {/* Link Suggestions Panel */}
              {showLinkPanel && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Select a trade to link</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLinkPanel(false)}
                    >
                      Cancel
                    </Button>
                  </div>

                  {loadingSuggestions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : linkSuggestions.length > 0 ? (
                    <TradeLinkSuggestions
                      suggestions={linkSuggestions}
                      onLink={handleLinkTrade}
                      onDismiss={() => setShowLinkPanel(false)}
                      mode="modal"
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">No matching trades found</p>
                      <p className="text-xs mt-1">
                        Create a trade first, or try adding a ticker to this entry
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Button */}
        <div className="mt-6">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {deleting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Entry
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
