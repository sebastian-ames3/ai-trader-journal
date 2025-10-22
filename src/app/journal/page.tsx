'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Entry {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL' | null;
  conviction: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  ticker: string | null;
  createdAt: string;
}

const moodEmojis = {
  CONFIDENT: '😊',
  NERVOUS: '😰',
  EXCITED: '🚀',
  UNCERTAIN: '🤔',
  NEUTRAL: '😐',
};

const typeColors = {
  TRADE_IDEA: 'bg-blue-100 text-blue-800 border-blue-200',
  TRADE: 'bg-green-100 text-green-800 border-green-200',
  REFLECTION: 'bg-purple-100 text-purple-800 border-purple-200',
  OBSERVATION: 'bg-orange-100 text-orange-800 border-orange-200',
};

const convictionColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  HIGH: 'bg-red-100 text-red-800 border-red-300',
};

export default function JournalPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/entries');
      if (!response.ok) throw new Error('Failed to fetch entries');
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  const formatEntryType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="animate-spin h-8 w-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Journal</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {entries.length === 0 ? (
          // Empty State
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-xl font-semibold mb-2">No entries yet</h2>
            <p className="text-gray-600 mb-6">
              Start journaling to track your trading psychology
            </p>
            <Link href="/journal/new">
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create First Entry
              </Button>
            </Link>
          </div>
        ) : (
          // Entry List
          <div className="space-y-4">
            {entries.map((entry) => (
              <Link key={entry.id} href={`/journal/${entry.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${typeColors[entry.type]} font-medium`}
                        >
                          {formatEntryType(entry.type)}
                        </Badge>
                        {entry.ticker && (
                          <Badge variant="secondary" className="font-mono">
                            {entry.ticker}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.mood && (
                          <span className="text-2xl" title={entry.mood}>
                            {moodEmojis[entry.mood]}
                          </span>
                        )}
                        {entry.conviction && (
                          <Badge
                            variant="outline"
                            className={`${convictionColors[entry.conviction]} text-xs`}
                          >
                            {entry.conviction}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-gray-700 line-clamp-3 mb-2">
                      {entry.content}
                    </p>

                    {/* Timestamp */}
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(entry.createdAt)}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link href="/journal/new">
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
          aria-label="Create new entry"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </Link>
    </div>
  );
}
