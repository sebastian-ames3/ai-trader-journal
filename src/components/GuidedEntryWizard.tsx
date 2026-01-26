'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type EntryType = 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION';
type EntryMood = 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
type ConvictionLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface TickerResult {
  symbol: string;
  name: string;
}

interface GuidedEntryWizardProps {
  initialData: {
    entryType: EntryType;
    content: string;
    mood: EntryMood;
    conviction: ConvictionLevel;
    ticker: string | null;
  };
  onUpdate: (data: Partial<{
    entryType: EntryType;
    content: string;
    mood: EntryMood;
    conviction: ConvictionLevel;
    ticker: string | null;
  }>) => void;
  onSubmit: () => void;
  onSwitchToFreeForm: () => void;
  submitting: boolean;
}

const moods: { value: EntryMood; emoji: string; label: string }[] = [
  { value: 'CONFIDENT', emoji: '😊', label: 'Confident' },
  { value: 'NERVOUS', emoji: '😰', label: 'Nervous' },
  { value: 'EXCITED', emoji: '🚀', label: 'Excited' },
  { value: 'UNCERTAIN', emoji: '🤔', label: 'Uncertain' },
  { value: 'NEUTRAL', emoji: '😐', label: 'Neutral' },
];

const convictionLevels: ConvictionLevel[] = ['LOW', 'MEDIUM', 'HIGH'];

const entryTypes: { value: EntryType; label: string }[] = [
  { value: 'IDEA', label: 'Idea' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'REFLECTION', label: 'Reflection' },
  { value: 'OBSERVATION', label: 'Observation' },
];

const entryTypePrompts: Record<EntryType, string> = {
  IDEA: "What's your thesis? What are you watching for?",
  DECISION: "What action did you take? How did it align with your plan?",
  REFLECTION: "What did you learn? What will you do differently?",
  OBSERVATION: "What patterns are you noticing in the market?",
};

export function GuidedEntryWizard({
  initialData,
  onUpdate,
  onSubmit,
  onSwitchToFreeForm,
  submitting,
}: GuidedEntryWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [tickerInput, setTickerInput] = useState(initialData.ticker || '');
  const [suggestions, setSuggestions] = useState<TickerResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleMoodSelect = (mood: EntryMood) => {
    onUpdate({ mood });
    handleNext();
  };

  const handleConvictionSelect = (conviction: ConvictionLevel) => {
    onUpdate({ conviction });
    handleNext();
  };

  const handleEntryTypeSelect = (entryType: EntryType) => {
    onUpdate({ entryType });
  };

  const handleTickerSearch = async (query: string) => {
    setTickerInput(query.toUpperCase());

    if (query.length < 1) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/ticker?q=${query}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to fetch ticker suggestions:', err);
    }
  };

  const handleTickerSelect = (symbol: string) => {
    onUpdate({ ticker: symbol });
    setTickerInput(symbol);
    setShowSuggestions(false);
  };

  const clearTicker = () => {
    onUpdate({ ticker: null });
    setTickerInput('');
  };

  const canProceedFromStep3 = initialData.content.trim().length > 0;

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col">
      {/* Progress Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchToFreeForm}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Switch to Free Form
          </Button>
        </div>

        {/* Progress Bar */}
        <div
          className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentStep}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Entry progress: step ${currentStep} of ${totalSteps}`}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold dark:text-gray-100" role="heading" aria-level={2}>
              How are you feeling right now?
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => handleMoodSelect(m.value)}
                  className={`px-6 py-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 min-h-[88px] ${
                    initialData.mood === m.value
                      ? 'border-primary bg-primary text-primary-foreground font-medium'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-200'
                  }`}
                >
                  <span className="text-3xl" role="img" aria-label={m.label}>
                    {m.emoji}
                  </span>
                  <span className="text-sm">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold dark:text-gray-100" role="heading" aria-level={2}>
              How confident are you?
            </h2>
            <div className="flex flex-col gap-3">
              {convictionLevels.map((level) => (
                <button
                  key={level}
                  onClick={() => handleConvictionSelect(level)}
                  className={`px-6 py-4 rounded-lg border-2 transition-all font-medium min-h-[56px] text-lg ${
                    initialData.conviction === level
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-4 dark:text-gray-100" role="heading" aria-level={2}>
                What type of entry is this?
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {entryTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleEntryTypeSelect(type.value)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all min-h-[48px] ${
                      initialData.entryType === type.value
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 dark:text-gray-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="guided-content" className="text-base font-medium mb-3 block dark:text-gray-200">
                {entryTypePrompts[initialData.entryType]}
              </Label>
              <Textarea
                id="guided-content"
                value={initialData.content}
                onChange={(e) => onUpdate({ content: e.target.value })}
                placeholder="Share your thoughts..."
                className="min-h-[200px] text-base resize-none"
                autoCapitalize="sentences"
                autoFocus
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {initialData.content.length} characters
              </p>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold dark:text-gray-100" role="heading" aria-level={2}>
              Any ticker symbol?
            </h2>
            <p className="text-gray-600 dark:text-gray-400">This is optional - skip if not applicable.</p>

            {initialData.ticker ? (
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-xl px-6 py-3 font-mono">
                  {initialData.ticker}
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
                  onChange={(e) => handleTickerSearch(e.target.value)}
                  placeholder="Search for ticker (e.g., AAPL)"
                  className="text-lg h-14"
                  autoCapitalize="characters"
                  autoFocus
                />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.symbol}
                        onClick={() => handleTickerSelect(suggestion.symbol)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg min-h-[44px]"
                      >
                        <div className="font-medium dark:text-gray-200">{suggestion.symbol}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.name}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t dark:border-gray-700">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="min-h-[48px] min-w-[100px]"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={currentStep === 3 && !canProceedFromStep3}
            className="min-h-[48px] min-w-[120px]"
            size="lg"
          >
            Next
            <ChevronRight className="h-5 w-5 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={submitting || !initialData.content.trim()}
            className="min-h-[48px] min-w-[140px]"
            size="lg"
          >
            {submitting ? 'Saving...' : 'Save Entry'}
          </Button>
        )}
      </div>
    </div>
  );
}
