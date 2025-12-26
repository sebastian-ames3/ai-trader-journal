'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FilterState {
  search: string;
  type: string;
  ticker: string;
  mood: string;
  conviction: string;
  sentiment: string;
  biases: string[];
  tags: string[];
  dateFrom: string;
  dateTo: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onSearch: () => void;
}

const ENTRY_TYPES = [
  { value: 'TRADE_IDEA', label: 'Trade Idea' },
  { value: 'TRADE', label: 'Trade' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];

const MOODS = [
  { value: 'CONFIDENT', label: 'Confident' },
  { value: 'NERVOUS', label: 'Nervous' },
  { value: 'EXCITED', label: 'Excited' },
  { value: 'UNCERTAIN', label: 'Uncertain' },
  { value: 'NEUTRAL', label: 'Neutral' },
  { value: 'FRUSTRATED', label: 'Frustrated' },
  { value: 'CALM', label: 'Calm' },
  { value: 'ANXIOUS', label: 'Anxious' },
  { value: 'OPTIMISTIC', label: 'Optimistic' },
  { value: 'FEARFUL', label: 'Fearful' },
  { value: 'GREEDY', label: 'Greedy' },
  { value: 'PATIENT', label: 'Patient' },
  { value: 'IMPULSIVE', label: 'Impulsive' },
  { value: 'DISCIPLINED', label: 'Disciplined' },
];

const CONVICTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

const SENTIMENTS = [
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'neutral', label: 'Neutral' },
];

const BIASES = [
  { value: 'confirmation_bias', label: 'Confirmation Bias' },
  { value: 'recency_bias', label: 'Recency Bias' },
  { value: 'loss_aversion', label: 'Loss Aversion' },
  { value: 'overconfidence', label: 'Overconfidence' },
  { value: 'fomo', label: 'FOMO' },
  { value: 'revenge_trading', label: 'Revenge Trading' },
  { value: 'anchoring', label: 'Anchoring' },
  { value: 'herd_mentality', label: 'Herd Mentality' },
  { value: 'outcome_bias', label: 'Outcome Bias' },
];

const AI_TAGS = [
  // Trade Type/Strategy
  { value: 'long-call', label: 'Long Call', category: 'Strategy' },
  { value: 'long-put', label: 'Long Put', category: 'Strategy' },
  { value: 'covered-call', label: 'Covered Call', category: 'Strategy' },
  { value: 'cash-secured-put', label: 'Cash Secured Put', category: 'Strategy' },
  { value: 'vertical-spread', label: 'Vertical Spread', category: 'Strategy' },
  { value: 'iron-condor', label: 'Iron Condor', category: 'Strategy' },
  { value: 'iron-butterfly', label: 'Iron Butterfly', category: 'Strategy' },
  { value: 'wheel-strategy', label: 'Wheel Strategy', category: 'Strategy' },
  // Market View
  { value: 'bullish', label: 'Bullish', category: 'Market View' },
  { value: 'bearish', label: 'Bearish', category: 'Market View' },
  { value: 'high-volatility', label: 'High Volatility', category: 'Market View' },
  { value: 'low-volatility', label: 'Low Volatility', category: 'Market View' },
  // Psychological State
  { value: 'disciplined', label: 'Disciplined', category: 'Psychology' },
  { value: 'patient', label: 'Patient', category: 'Psychology' },
  { value: 'well-researched', label: 'Well Researched', category: 'Psychology' },
  { value: 'emotional', label: 'Emotional', category: 'Psychology' },
  { value: 'impulse-trade', label: 'Impulse Trade', category: 'Psychology' },
  { value: 'overthinking', label: 'Overthinking', category: 'Psychology' },
  // Risk Assessment
  { value: 'defined-risk', label: 'Defined Risk', category: 'Risk' },
  { value: 'position-sized', label: 'Position Sized', category: 'Risk' },
  // Entry Catalyst
  { value: 'technical-analysis', label: 'Technical Analysis', category: 'Catalyst' },
  { value: 'earnings', label: 'Earnings Play', category: 'Catalyst' },
];

export default function SearchFilters({
  filters,
  onFiltersChange,
  onSearch,
}: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilter = (key: keyof FilterState, value: string | string[]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      type: '',
      ticker: '',
      mood: '',
      conviction: '',
      sentiment: '',
      biases: [],
      tags: [],
      dateFrom: '',
      dateTo: '',
    });
  };

  const toggleBias = (bias: string) => {
    const newBiases = filters.biases.includes(bias)
      ? filters.biases.filter((b) => b !== bias)
      : [...filters.biases, bias];
    updateFilter('biases', newBiases);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter((t) => t !== tag)
      : [...filters.tags, tag];
    updateFilter('tags', newTags);
  };

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.ticker ||
    filters.mood ||
    filters.conviction ||
    filters.sentiment ||
    filters.biases.length > 0 ||
    filters.tags.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="bg-white dark:bg-gray-800 border-b sticky top-0 z-20 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search journal entries..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={onSearch}>Search</Button>
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={showAdvanced ? 'bg-gray-100 dark:bg-gray-700' : ''}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="default" className="ml-2 px-1.5 py-0.5 text-xs">
                {[
                  filters.type,
                  filters.ticker,
                  filters.mood,
                  filters.conviction,
                  filters.sentiment,
                  ...filters.biases,
                  ...filters.tags,
                  filters.dateFrom,
                  filters.dateTo,
                ].filter(Boolean).length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 pb-2">
            {/* Row 1: Type, Ticker, Mood */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Type
                </label>
                <Select
                  value={filters.type || '_all'}
                  onValueChange={(value) => updateFilter('type', value === '_all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All types</SelectItem>
                    {ENTRY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Ticker
                </label>
                <Input
                  type="text"
                  placeholder="e.g., AAPL"
                  value={filters.ticker}
                  onChange={(e) =>
                    updateFilter('ticker', e.target.value.toUpperCase())
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Mood
                </label>
                <Select
                  value={filters.mood || '_all'}
                  onValueChange={(value) => updateFilter('mood', value === '_all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All moods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All moods</SelectItem>
                    {MOODS.map((mood) => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 2: Conviction, Sentiment, Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Conviction
                </label>
                <Select
                  value={filters.conviction || '_all'}
                  onValueChange={(value) => updateFilter('conviction', value === '_all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All levels</SelectItem>
                    {CONVICTIONS.map((conviction) => (
                      <SelectItem key={conviction.value} value={conviction.value}>
                        {conviction.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Sentiment
                </label>
                <Select
                  value={filters.sentiment || '_all'}
                  onValueChange={(value) => updateFilter('sentiment', value === '_all' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All sentiments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All sentiments</SelectItem>
                    {SENTIMENTS.map((sentiment) => (
                      <SelectItem key={sentiment.value} value={sentiment.value}>
                        {sentiment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Date From
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter('dateFrom', e.target.value)}
                />
              </div>
            </div>

            {/* Row 3: Date To & Biases */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Date To
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter('dateTo', e.target.value)}
                />
              </div>
            </div>

            {/* Biases - Multi-select chips */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Cognitive Biases
              </label>
              <div className="flex flex-wrap gap-2">
                {BIASES.map((bias) => (
                  <Badge
                    key={bias.value}
                    variant={
                      filters.biases.includes(bias.value) ? 'default' : 'outline'
                    }
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleBias(bias.value)}
                  >
                    {bias.label}
                    {filters.biases.includes(bias.value) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* AI Tags - Multi-select chips */}
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                AI Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {AI_TAGS.map((tag) => (
                  <Badge
                    key={tag.value}
                    variant={
                      filters.tags.includes(tag.value) ? 'default' : 'outline'
                    }
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => toggleTag(tag.value)}
                  >
                    {tag.label}
                    {filters.tags.includes(tag.value) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
