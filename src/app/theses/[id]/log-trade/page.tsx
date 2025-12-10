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
import VoiceRecorder from '@/components/VoiceRecorder';
import AudioPlayer from '@/components/AudioPlayer';

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

interface VoiceData {
  audioBlob: Blob;
  duration: number;
  transcription: string;
}

export default function LogTradePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const thesisId = params.id as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thesisName, setThesisName] = useState<string>('');
  const [thesisTicker, setThesisTicker] = useState<string>('');

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

  // File attachment state (mocked for now - would need R2 integration)
  const [attachments, setAttachments] = useState<File[]>([]);

  // Fetch thesis info
  useEffect(() => {
    const fetchThesis = async () => {
      try {
        const response = await fetch(`/api/theses/${thesisId}`);
        if (response.ok) {
          const data = await response.json();
          setThesisName(data.name);
          setThesisTicker(data.ticker);
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
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Form validation
  const isValid = description.trim() && debitCredit !== '';

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
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
          // Note: Attachments would need R2 upload implementation
          // For now, we're just logging the trade without attachments
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
              {thesisName && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  <Badge variant="outline" className="font-mono text-xs mr-2">
                    ${thesisTicker}
                  </Badge>
                  {thesisName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the trade... e.g., 'Sold 145/150 call spread for $1.85 credit'"
              className="min-h-[100px] resize-y"
            />
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
                onChange={(e) => setDebitCredit(e.target.value)}
                placeholder="-2.50 or +1.85"
                className="min-h-[44px]"
              />
              <p className="text-xs text-slate-500">
                Negative = debit, Positive = credit
              </p>
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
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="min-h-[44px]"
              />
              <p className="text-xs text-slate-500">
                Number of contracts/spreads
              </p>
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
              onChange={(e) => setExpiration(e.target.value)}
              className="min-h-[44px]"
            />
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
              Note: File upload requires cloud storage setup. Screenshots are logged but not stored yet.
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
                'Log Trade'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
