'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Entry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' | null;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ticker: string | null;
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

              {/* Updated timestamp if different from created */}
              {entry.updatedAt !== entry.createdAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Last updated: {formatDateTime(entry.updatedAt)}
                </p>
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
