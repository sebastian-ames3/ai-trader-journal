'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Hash,
  Mic,
  X,
  Image as ImageIcon,
  Loader2,
  FileText,
  Brain,
  Camera,
  Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { validateTradeForm, getFieldError } from '@/lib/validation';
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';
import ScreenshotExtractor, { type ExtractedTradeData } from '@/components/trades/ScreenshotExtractor';
import AIReminders, { type RiskWarning, type HistoricalLesson, type PatternInsight } from '@/components/trades/AIReminders';

const TRADE_ACTIONS = [
  { value: 'INITIAL', label: 'Initial Position', description: 'Opening a new position' },
  { value: 'ADD', label: 'Add to Position', description: 'Scaling into existing position' },
  { value: 'REDUCE', label: 'Reduce Position', description: 'Taking partial profits' },
  { value: 'ROLL', label: 'Roll Position', description: 'Rolling to new expiration/strikes' },
  { value: 'CONVERT', label: 'Convert Strategy', description: 'Changing strategy type' },
  { value: 'CLOSE', label: 'Close Position', description: 'Closing the entire position' },
  { value: 'ASSIGNED', label: 'Assigned', description: 'Option was assigned' },
  { value: 'EXERCISED', label: 'Exercised', description: 'Option was exercised' },
];

const STRATEGY_TYPES = [
  { value: 'LONG_CALL', label: 'Long Call' },
  { value: 'LONG_PUT', label: 'Long Put' },
  { value: 'SHORT_CALL', label: 'Short Call (Naked)' },
  { value: 'SHORT_PUT', label: 'Short Put (Naked)' },
  { value: 'CALL_SPREAD', label: 'Call Spread' },
  { value: 'PUT_SPREAD', label: 'Put Spread' },
  { value: 'IRON_CONDOR', label: 'Iron Condor' },
  { value: 'IRON_BUTTERFLY', label: 'Iron Butterfly' },
  { value: 'STRADDLE', label: 'Straddle' },
  { value: 'STRANGLE', label: 'Strangle' },
  { value: 'CALENDAR', label: 'Calendar Spread' },
  { value: 'DIAGONAL', label: 'Diagonal Spread' },
  { value: 'RATIO', label: 'Ratio Spread' },
  { value: 'BUTTERFLY', label: 'Butterfly' },
  { value: 'STOCK', label: 'Stock Position' },
  { value: 'COVERED_CALL', label: 'Covered Call' },
  { value: 'CASH_SECURED_PUT', label: 'Cash Secured Put' },
  { value: 'CUSTOM', label: 'Custom/Other' },
];

type CaptureMode = 'choose' | 'screenshot' | 'manual';

interface VoiceData {
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  transcription: string;
}

interface ThesisData {
  id: string;
  name: string;
  ticker: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  strategyType?: string;
}

export default function LogTradePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const thesisId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thesisData, setThesisData] = useState<ThesisData | null>(null);

  // PRD-B: Screenshot-first capture mode
  const [captureMode, setCaptureMode] = useState<CaptureMode>('choose');

  // Form state
  const [action, setAction] = useState<string>('INITIAL');
  const [strategyType, setStrategyType] = useState<string>('');
  const [description, setDescription] = useState('');
  const [debitCredit, setDebitCredit] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [expiration, setExpiration] = useState('');
  const [reasoningNote, setReasoningNote] = useState('');

  // Voice recording state
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // File attachment state
  const [attachments, setAttachments] = useState<File[]>([]);

  // Screenshot extraction state
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [showExtractor, setShowExtractor] = useState(false);

  // AI Reminders state
  const [showAIReminders, setShowAIReminders] = useState(false);
  const [aiRemindersLoading, setAiRemindersLoading] = useState(false);
  const [warnings, setWarnings] = useState<RiskWarning[]>([]);
  const [lessons, setLessons] = useState<HistoricalLesson[]>([]);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);

  // Form validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fetch thesis info
  useEffect(() => {
    const fetchThesis = async () => {
      try {
        const response = await fetch(`/api/theses/${thesisId}`);
        if (response.ok) {
          const data = await response.json();
          setThesisData({
            id: data.id,
            name: data.name,
            ticker: data.ticker,
            direction: data.direction,
            strategyType: data.strategyType,
          });
        }
      } catch (error) {
        console.error('Error fetching thesis:', error);
      }
    };
    fetchThesis();
  }, [thesisId]);

  // Handle voice recording completion
  const handleVoiceComplete = useCallback((data: VoiceData) => {
    setVoiceData(data);
    setShowVoiceRecorder(false);
    // Pre-fill description with transcription if empty
    if (!description.trim()) {
      setDescription(data.transcription);
    }
    toast({
      title: 'Voice recorded',
      description: 'Your voice note has been transcribed',
    });
  }, [description, toast]);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).filter(f =>
        f.type.startsWith('image/') || f.type === 'application/pdf'
      );

      // Check if any are images for screenshot extraction
      const imageFile = newFiles.find(f => f.type.startsWith('image/'));
      if (imageFile && !screenshotFile) {
        setScreenshotFile(imageFile);
        setShowExtractor(true);
      }

      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    const fileToRemove = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));

    // If removing the screenshot file, also clear extractor
    if (screenshotFile && fileToRemove === screenshotFile) {
      setScreenshotFile(null);
      setShowExtractor(false);
    }
  };

  // Handle screenshot extraction complete
  const handleExtractionComplete = useCallback((data: ExtractedTradeData) => {
    // Update form fields with extracted data
    if (data.ticker && data.ticker.toUpperCase() !== thesisData?.ticker.toUpperCase()) {
      toast({
        title: 'Ticker mismatch',
        description: `Screenshot shows ${data.ticker}, but thesis is for ${thesisData?.ticker}. Please verify.`,
        variant: 'destructive',
      });
    }

    if (data.strategyType && !strategyType) {
      setStrategyType(data.strategyType);
    }
    if (data.expiration && !expiration) {
      setExpiration(data.expiration);
    }
    if (data.quantity && quantity === '1') {
      setQuantity(data.quantity.toString());
    }
    if (data.debitCredit !== undefined && !debitCredit) {
      setDebitCredit(data.debitCredit.toString());
    }
    if (data.action && action === 'INITIAL') {
      setAction(data.action);
    }

    // Add strikes info to description if available
    if (data.strikes && !description.includes(data.strikes)) {
      setDescription(prev => prev ? `${prev}\nStrikes: ${data.strikes}` : `Strikes: ${data.strikes}`);
    }

    toast({
      title: 'Data extracted',
      description: 'Review and adjust the extracted trade details',
    });
  }, [thesisData, strategyType, expiration, quantity, debitCredit, action, description, toast]);

  // Fetch AI reminders when showing the modal
  const fetchAIReminders = useCallback(async () => {
    if (!thesisData) return;

    setAiRemindersLoading(true);

    try {
      const params = new URLSearchParams({
        ticker: thesisData.ticker,
        thesisId: thesisId,
        ...(strategyType && { strategyType }),
        ...(thesisData.direction && { direction: thesisData.direction }),
        ...(debitCredit && { debitCredit }),
      });

      const response = await fetch(`/api/trades/ai-reminders?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setWarnings(data.warnings || []);
        setLessons(data.lessons || []);
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Error fetching AI reminders:', error);
      // Don't show error toast - AI reminders are optional
    } finally {
      setAiRemindersLoading(false);
    }
  }, [thesisData, thesisId, strategyType, debitCredit]);

  // Form validation - check if form has required fields and no errors
  const hasRequiredFields = description.trim() && debitCredit !== '';
  const hasNoErrors = Object.keys(validationErrors).length === 0;
  const isValid = hasRequiredFields && hasNoErrors;

  // Clear field error when user types
  const clearFieldError = (field: string) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Handle showing AI reminders before submit
  const handlePreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate the form
    const result = validateTradeForm({
      action,
      strategyType: strategyType || null,
      description,
      debitCredit,
      quantity,
      expiration: expiration || null,
      reasoningNote: reasoningNote || null,
    });

    if (!result.success) {
      setValidationErrors(result.errors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      });
      return;
    }

    // Clear any previous errors
    setValidationErrors({});

    // Show AI reminders before final submit
    setShowAIReminders(true);
    await fetchAIReminders();
  };

  // Handle final submit after AI review
  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setShowAIReminders(false);

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thesisId,
          action,
          strategyType: strategyType || null,
          description: description.trim(),
          debitCredit: parseFloat(debitCredit),
          quantity: parseInt(quantity, 10) || 1,
          expiration: expiration || null,
          reasoningNote: reasoningNote.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to log trade');
      }

      toast({
        title: 'Trade logged',
        description: 'Your trade has been recorded successfully',
      });

      router.push(`/theses/${thesisId}`);
    } catch (error) {
      console.error('Error logging trade:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to log trade',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reconsider from AI reminders
  const handleReconsider = () => {
    setShowAIReminders(false);
    toast({
      title: 'Take your time',
      description: 'Review your trade setup before proceeding',
    });
  };

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
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Log Trade
              </h1>
              {thesisData && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <Badge variant="outline" className="font-mono text-xs mr-2">
                    ${thesisData.ticker}
                  </Badge>
                  {thesisData.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* PRD-B: Mode chooser - screenshot-first approach */}
        {captureMode === 'choose' && (
          <div className="space-y-4 mb-6">
            <p className="text-sm text-muted-foreground text-center">
              How would you like to log this trade?
            </p>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setCaptureMode('screenshot');
                  setShowExtractor(true);
                }}
                className={cn(
                  'p-6 rounded-xl border-2 text-center transition-all',
                  'border-primary/50 bg-primary/5 hover:bg-primary/10',
                  'flex flex-col items-center gap-3'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Screenshot</p>
                  <p className="text-xs text-muted-foreground">
                    Snap or upload a trade screenshot
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">Recommended</Badge>
              </button>

              <button
                type="button"
                onClick={() => setCaptureMode('manual')}
                className={cn(
                  'p-6 rounded-xl border-2 text-center transition-all',
                  'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800',
                  'hover:border-slate-300 dark:hover:border-slate-600',
                  'flex flex-col items-center gap-3'
                )}
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <Edit3 className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Manual Entry</p>
                  <p className="text-xs text-muted-foreground">
                    Type in trade details
                  </p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Screenshot capture mode */}
        {captureMode === 'screenshot' && !screenshotFile && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCaptureMode('choose')}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCaptureMode('manual')}
              >
                <Edit3 className="h-4 w-4 mr-1" />
                Manual Entry
              </Button>
            </div>

            <div className="p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Screenshot Trade</h3>
                <p className="text-sm text-muted-foreground">
                  Take a photo or upload a screenshot of your position
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <label htmlFor="screenshot-camera" className="cursor-pointer">
                  <Button type="button" variant="default" asChild>
                    <span>
                      <Camera className="h-4 w-4 mr-2" />
                      Camera
                    </span>
                  </Button>
                  <input
                    id="screenshot-camera"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setScreenshotFile(file);
                        setAttachments(prev => [...prev, file]);
                        setShowExtractor(true);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
                <label htmlFor="screenshot-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <ImageIcon className="h-4 w-4 mr-2" />
                      Upload
                    </span>
                  </Button>
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setScreenshotFile(file);
                        setAttachments(prev => [...prev, file]);
                        setShowExtractor(true);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* Screenshot Extractor - shown when screenshot is captured */}
          {showExtractor && screenshotFile && (
            <div className="space-y-4">
              {captureMode === 'screenshot' && (
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCaptureMode('choose');
                      setShowExtractor(false);
                      setScreenshotFile(null);
                      setAttachments(prev => prev.filter(f => f !== screenshotFile));
                    }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                </div>
              )}
              <ScreenshotExtractor
                imageFile={screenshotFile}
                onExtractComplete={(data) => {
                  handleExtractionComplete(data);
                  // After extraction, show the form for confirmation
                  if (captureMode === 'screenshot') {
                    setCaptureMode('manual');
                  }
                }}
                onRemove={() => {
                  setShowExtractor(false);
                  setScreenshotFile(null);
                  // Also remove from attachments
                  const index = attachments.indexOf(screenshotFile);
                  if (index > -1) {
                    removeAttachment(index);
                  }
                  if (captureMode === 'screenshot') {
                    setCaptureMode('choose');
                  }
                }}
                className="mb-6"
              />
            </div>
          )}

          {/* Only show form fields in manual mode or after screenshot extraction */}
          {(captureMode === 'manual' || (captureMode === 'screenshot' && !showExtractor && screenshotFile)) && (
            <>
          {/* Action Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">What did you do?</Label>
            <div className="grid grid-cols-2 gap-2">
              {TRADE_ACTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAction(opt.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-left transition-all min-h-[60px]',
                    action === opt.value
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  )}
                >
                  <p className={cn(
                    'font-medium text-sm',
                    action === opt.value ? 'text-amber-700 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'
                  )}>
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Type */}
          <div className="space-y-2">
            <Label htmlFor="strategyType" className="text-sm font-medium">
              Strategy Type (optional)
            </Label>
            <Select value={strategyType} onValueChange={setStrategyType}>
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select strategy type..." />
              </SelectTrigger>
              <SelectContent>
                {STRATEGY_TYPES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="text-sm font-medium">
                Trade Description *
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                className="h-8 text-xs"
              >
                <Mic className="h-3.5 w-3.5 mr-1" />
                {showVoiceRecorder ? 'Hide' : 'Voice'}
              </Button>
            </div>

            {showVoiceRecorder && (
              <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 mb-2">
                <VoiceRecorder
                  onRecordingComplete={handleVoiceComplete}
                  onError={(error) => toast({ title: 'Recording error', description: error, variant: 'destructive' })}
                />
              </div>
            )}

            {voiceData && (
              <div className="mb-2">
                <AudioPlayer
                  src={URL.createObjectURL(voiceData.audioBlob)}
                  duration={voiceData.duration}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setVoiceData(null)}
                  className="mt-2 h-8 text-xs text-slate-500"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Remove recording
                </Button>
              </div>
            )}

            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearFieldError('description');
              }}
              placeholder="Describe the trade... e.g., 'Sold 145/150 call spread for $1.85 credit'"
              className={cn(
                'min-h-[100px] resize-y',
                getFieldError(validationErrors, 'description') && 'border-red-500 focus-visible:ring-red-500'
              )}
              aria-invalid={!!getFieldError(validationErrors, 'description')}
              aria-describedby={getFieldError(validationErrors, 'description') ? 'description-error' : undefined}
            />
            {getFieldError(validationErrors, 'description') && (
              <p id="description-error" className="text-sm text-red-600 dark:text-red-400 mt-1">
                {getFieldError(validationErrors, 'description')}
              </p>
            )}
          </div>

          {/* Debit/Credit and Quantity Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="debitCredit" className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                Debit/Credit *
              </Label>
              <Input
                id="debitCredit"
                type="number"
                step="0.01"
                value={debitCredit}
                onChange={(e) => {
                  setDebitCredit(e.target.value);
                  clearFieldError('debitCredit');
                }}
                placeholder="-2.50 or +1.85"
                className={cn(
                  'min-h-[44px]',
                  getFieldError(validationErrors, 'debitCredit') && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!getFieldError(validationErrors, 'debitCredit')}
                aria-describedby={getFieldError(validationErrors, 'debitCredit') ? 'debitCredit-error' : 'debitCredit-hint'}
              />
              {getFieldError(validationErrors, 'debitCredit') ? (
                <p id="debitCredit-error" className="text-sm text-red-600 dark:text-red-400">
                  {getFieldError(validationErrors, 'debitCredit')}
                </p>
              ) : (
                <p id="debitCredit-hint" className="text-xs text-slate-500">
                  Negative = debit, Positive = credit
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" />
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  clearFieldError('quantity');
                }}
                placeholder="1"
                className={cn(
                  'min-h-[44px]',
                  getFieldError(validationErrors, 'quantity') && 'border-red-500 focus-visible:ring-red-500'
                )}
                aria-invalid={!!getFieldError(validationErrors, 'quantity')}
                aria-describedby={getFieldError(validationErrors, 'quantity') ? 'quantity-error' : 'quantity-hint'}
              />
              {getFieldError(validationErrors, 'quantity') ? (
                <p id="quantity-error" className="text-sm text-red-600 dark:text-red-400">
                  {getFieldError(validationErrors, 'quantity')}
                </p>
              ) : (
                <p id="quantity-hint" className="text-xs text-slate-500">
                  Number of contracts/spreads
                </p>
              )}
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiration" className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Expiration Date (optional)
            </Label>
            <Input
              id="expiration"
              type="date"
              value={expiration}
              onChange={(e) => {
                setExpiration(e.target.value);
                clearFieldError('expiration');
              }}
              className={cn(
                'min-h-[44px]',
                getFieldError(validationErrors, 'expiration') && 'border-red-500 focus-visible:ring-red-500'
              )}
              aria-invalid={!!getFieldError(validationErrors, 'expiration')}
              aria-describedby={getFieldError(validationErrors, 'expiration') ? 'expiration-error' : undefined}
            />
            {getFieldError(validationErrors, 'expiration') && (
              <p id="expiration-error" className="text-sm text-red-600 dark:text-red-400 mt-1">
                {getFieldError(validationErrors, 'expiration')}
              </p>
            )}
          </div>

          {/* Reasoning Note */}
          <div className="space-y-2">
            <Label htmlFor="reasoning" className="text-sm font-medium flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Reasoning (optional)
            </Label>
            <Textarea
              id="reasoning"
              value={reasoningNote}
              onChange={(e) => setReasoningNote(e.target.value)}
              placeholder="Why are you making this trade? What's your reasoning?"
              className="min-h-[80px] resize-y"
            />
          </div>

          {/* Attachments */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-1">
              <ImageIcon className="h-3.5 w-3.5" />
              Screenshots & Attachments
            </Label>

            {/* File input */}
            <div className="flex items-center gap-3">
              <label
                htmlFor="file-upload"
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'p-4 rounded-xl border-2 border-dashed',
                  'border-slate-300 dark:border-slate-600',
                  'hover:border-slate-400 dark:hover:border-slate-500',
                  'cursor-pointer transition-colors',
                  'text-slate-500 dark:text-slate-400'
                )}
              >
                <ImageIcon className="h-5 w-5" />
                <span className="text-sm">Add screenshots or PDFs</span>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Attachment previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, index) => (
                  <div
                    key={index}
                    className="relative group flex items-center gap-2 p-2 pr-8 rounded-lg bg-slate-100 dark:bg-slate-800"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="h-4 w-4 text-slate-500" />
                    ) : (
                      <FileText className="h-4 w-4 text-slate-500" />
                    )}
                    <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                      {file.name}
                    </span>
                    {file === screenshotFile && (
                      <Badge variant="outline" className="text-xs">
                        Extracting
                      </Badge>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                      aria-label="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Images will be analyzed by AI to extract trade details. PDFs are stored as attachments.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="w-full min-h-[48px] text-base"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Logging Trade...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Review & Log Trade
                </>
              )}
            </Button>
          </div>
            </>
          )}
        </form>
      </div>

      {/* AI Reminders Modal */}
      {showAIReminders && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <AIReminders
              ticker={thesisData?.ticker || ''}
              strategyType={strategyType}
              direction={thesisData?.direction}
              warnings={warnings}
              lessons={lessons}
              patterns={patterns}
              isLoading={aiRemindersLoading}
              onAcknowledge={handleSubmit}
              onReconsider={handleReconsider}
            />
          </div>
        </div>
      )}
    </div>
  );
}
