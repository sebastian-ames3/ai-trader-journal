'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, Send, Loader2, Mic, Camera, ChevronDown, ChevronUp, Sparkles, ScanText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import VoiceRecorder from './VoiceRecorder';
import AudioPlayer from './AudioPlayer';
import { VoiceCapturePreview } from './voice/VoiceCapturePreview';
import type { TradeDetectionResult } from '@/lib/tradeDetection';
import { TRADE_DETECTION_CONFIDENCE_THRESHOLD } from '@/lib/tradeDetection';
import ImageCapture, { ImageAnalysis, OCRResult } from './ImageCapture';
import OCRReviewModal from './entries/OCRReviewModal';
import TradeLinkSuggestions, { LinkSuggestion } from './entries/TradeLinkSuggestions';
import TradeDetectionPrompt from './entries/TradeDetectionPrompt';
import QuickTradeCapture from './trades/QuickTradeCapture';
import { cn } from '@/lib/utils';
import type { TradeOutcome } from '@/lib/constants/taxonomy';

type QuickCaptureTab = 'journal' | 'quick-trade';

// Ticker detection regex - matches common stock ticker patterns
const TICKER_REGEX = /\$([A-Z]{1,5})\b|\b([A-Z]{2,5})\b(?=\s*(call|put|spread|option|trade|position|stock|shares|buy|sell|long|short|bullish|bearish|strike))/gi;

interface QuickCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'text' | 'voice' | 'photo' | null;
  initialTab?: QuickCaptureTab;
}

interface InferredMetadata {
  entryType: 'IDEA' | 'DECISION' | 'REFLECTION' | 'OBSERVATION';
  mood: 'CONFIDENT' | 'NERVOUS' | 'EXCITED' | 'UNCERTAIN' | 'NEUTRAL';
  conviction: 'LOW' | 'MEDIUM' | 'HIGH';
  ticker: string | null;
  sentiment: 'positive' | 'negative' | 'neutral';
}

type SubmitState = 'idle' | 'inferring' | 'submitting' | 'success' | 'error';

const ENTRY_TYPE_LABELS: Record<string, string> = {
  IDEA: 'Idea',
  DECISION: 'Decision',
  REFLECTION: 'Reflection',
  OBSERVATION: 'Observation',
};

const MOOD_LABELS: Record<string, string> = {
  CONFIDENT: 'Confident',
  NERVOUS: 'Nervous',
  EXCITED: 'Excited',
  UNCERTAIN: 'Uncertain',
  NEUTRAL: 'Neutral',
};

const CONVICTION_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

// Also export as named export for flexibility
export function QuickCapture({ isOpen, onClose, initialMode, initialTab: initialTabProp }: QuickCaptureProps) {
  const router = useRouter();

  // Form state
  const [content, setContent] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);

  // Image state
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageAnalyses, setImageAnalyses] = useState<(ImageAnalysis | null)[]>([]);

  // Inferred metadata
  const [inferred, setInferred] = useState<InferredMetadata | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Override values (user can modify inferred values)
  const [entryType, setEntryType] = useState<string | null>(null);
  const [mood, setMood] = useState<string | null>(null);
  const [conviction, setConviction] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);

  // UI state
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [showJournalScanner, setShowJournalScanner] = useState(false);

  // OCR Review Modal state
  const [showOCRReview, setShowOCRReview] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [ocrImageUrl, setOcrImageUrl] = useState<string | null>(null);
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [linkSuggestions, setLinkSuggestions] = useState<LinkSuggestion[]>([]);

  // Inline trade link state (for non-OCR entries)
  const [inlineLinkSuggestions, setInlineLinkSuggestions] = useState<LinkSuggestion[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [linkDismissed, setLinkDismissed] = useState(false);

  // Trade detection prompt state (PRD-B)
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);
  const [tradeDetection, setTradeDetection] = useState<TradeDetectionResult | null>(null);
  const [showTradePrompt, setShowTradePrompt] = useState(false);

  // Voice + Trade preview state (Fix C)
  const [voicePreviewMode, setVoicePreviewMode] = useState(false);
  const [voiceDetection, setVoiceDetection] = useState<TradeDetectionResult | null>(null);
  const [voiceAudioUrl, setVoiceAudioUrl] = useState<string | null>(null);
  const [voiceAudioDuration, setVoiceAudioDuration] = useState<number | null>(null);
  const [voiceTranscription, setVoiceTranscription] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Tab state for Journal vs Quick Trade (PRD-B)
  const [activeTab, setActiveTab] = useState<QuickCaptureTab>(initialTabProp || 'journal');

  // Deferred focus ref - wait for slide-in animation to complete
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset form when closed
  useEffect(() => {
    if (!isOpen) {
      // Delay reset to allow animation
      const timer = setTimeout(() => {
        setContent('');
        setAudioBlob(null);
        setAudioUrl(null);
        setAudioDuration(null);
        setTranscription(null);
        setImageUrls([]);
        setImageAnalyses([]);
        setInferred(null);
        setShowDetails(false);
        setEntryType(null);
        setMood(null);
        setConviction(null);
        setTicker(null);
        setSubmitState('idle');
        setError(null);
        setShowVoice(false);
        setShowImage(false);
        setShowJournalScanner(false);
        setShowOCRReview(false);
        setOcrResult(null);
        setOcrImageUrl(null);
        setOcrWarnings([]);
        setLinkSuggestions([]);
        setInlineLinkSuggestions([]);
        setSelectedTradeId(null);
        setLinkDismissed(false);
        setSavedEntryId(null);
        setTradeDetection(null);
        setShowTradePrompt(false);
        setVoicePreviewMode(false);
        setVoiceDetection(null);
        setVoiceAudioUrl(null);
        setVoiceAudioDuration(null);
        setVoiceTranscription(null);
        setIsDetecting(false);
        setActiveTab(initialTabProp || 'journal');
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Handle initial mode when modal opens
  useEffect(() => {
    if (isOpen && initialMode) {
      if (initialMode === 'voice') {
        setShowVoice(true);
        setShowImage(false);
        setShowJournalScanner(false);
      } else if (initialMode === 'photo') {
        setShowImage(true);
        setShowVoice(false);
        setShowJournalScanner(false);
      }
      // 'text' mode is the default - just focus on textarea
    }
  }, [isOpen, initialMode]);

  // Deferred focus - wait for slide-in animation to finish before focusing textarea
  useEffect(() => {
    if (isOpen && activeTab === 'journal') {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen, activeTab]);

  // Handle voice recording complete — runs trade detection and shows preview if confident
  const handleRecordingComplete = useCallback(
    async (data: { audioBlob: Blob; audioUrl: string; duration: number; transcription: string }) => {
      setAudioBlob(data.audioBlob);
      setAudioUrl(data.audioUrl);
      setAudioDuration(data.duration);
      setTranscription(data.transcription);
      setShowVoice(false);

      // Store for voice preview
      setVoiceAudioUrl(data.audioUrl);
      setVoiceAudioDuration(data.duration);
      setVoiceTranscription(data.transcription);

      // Run trade detection on the transcription
      setIsDetecting(true);
      try {
        const response = await fetch('/api/trades/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: data.transcription }),
        });
        if (response.ok) {
          const detection: TradeDetectionResult = await response.json();
          if (detection.detected && detection.confidence >= TRADE_DETECTION_CONFIDENCE_THRESHOLD) {
            setVoiceDetection(detection);
            setVoicePreviewMode(true);
            setIsDetecting(false);
            return; // Don't append to textarea — preview handles saving
          }
        }
      } catch (err) {
        console.error('Trade detection failed:', err);
      }
      setIsDetecting(false);

      // No trade detected — fall through to normal textarea flow
      setContent((prev) => {
        if (prev.trim()) {
          return `${prev}\n\n${data.transcription}`;
        }
        return data.transcription;
      });
    },
    []
  );

  // Save both journal entry and trade from voice preview
  const handleVoiceSaveBoth = useCallback(
    async (options: { transcription: string; tradeOutcome?: TradeOutcome }) => {
      const entryResponse = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: options.transcription,
          type: 'REFLECTION',
          mood: 'NEUTRAL',
          conviction: 'MEDIUM',
          captureMethod: 'VOICE',
          transcription: options.transcription,
          audioDuration: voiceAudioDuration || undefined,
        }),
      });

      if (!entryResponse.ok) {
        const data = await entryResponse.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      const entryData = await entryResponse.json();
      const entryId = entryData.entry?.id || entryData.id;

      if (options.tradeOutcome && entryId) {
        const tradeResponse = await fetch(`/api/entries/${entryId}/log-trade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            outcome: options.tradeOutcome,
            ticker: voiceDetection?.signals.ticker || undefined,
            approximatePnL: voiceDetection?.signals.approximatePnL || undefined,
          }),
        });
        if (!tradeResponse.ok) {
          const data = await tradeResponse.json();
          throw new Error(data.error || 'Failed to log trade');
        }
      }

      setVoicePreviewMode(false);
      onClose();
      router.push('/trades');
      router.refresh();
    },
    [voiceAudioDuration, voiceDetection, onClose, router]
  );

  // Save just the journal entry from voice preview
  const handleVoiceSaveEntryOnly = useCallback(
    async (transcriptionText: string) => {
      const entryResponse = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: transcriptionText,
          type: 'REFLECTION',
          mood: 'NEUTRAL',
          conviction: 'MEDIUM',
          captureMethod: 'VOICE',
          transcription: transcriptionText,
          audioDuration: voiceAudioDuration || undefined,
        }),
      });

      if (!entryResponse.ok) {
        const data = await entryResponse.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      setVoicePreviewMode(false);
      onClose();
      router.push('/journal');
      router.refresh();
    },
    [voiceAudioDuration, onClose, router]
  );

  // Handle image capture complete
  const handleImageCapture = useCallback(
    (data: { imageUrl: string; analysis: ImageAnalysis | null }) => {
      setImageUrls((prev) => [...prev, data.imageUrl]);
      setImageAnalyses((prev) => [...prev, data.analysis]);

      // If analysis extracted a ticker and we don't have one, use it
      if (data.analysis?.ticker && !ticker && !inferred?.ticker) {
        setTicker(data.analysis.ticker);
      }

      // Append analysis summary to content
      if (data.analysis?.summary) {
        setContent((prev) => {
          if (prev.trim()) {
            return `${prev}\n\n[Image: ${data.analysis!.summary}]`;
          }
          return `[Image: ${data.analysis!.summary}]`;
        });
      }

      setShowImage(false);
    },
    [ticker, inferred?.ticker]
  );

  // Handle journal scan complete
  const handleJournalScan = useCallback(
    async (data: { imageUrl: string; ocrResult: OCRResult; warnings?: string[] }) => {
      setOcrResult(data.ocrResult);
      setOcrImageUrl(data.imageUrl);
      setOcrWarnings(data.warnings || []);
      setShowJournalScanner(false);

      // Fetch link suggestions if we have tickers
      if (data.ocrResult.tickers.length > 0) {
        try {
          const response = await fetch('/api/journal/link-suggestions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tickers: data.ocrResult.tickers,
              date: data.ocrResult.date || new Date().toISOString(),
              content: data.ocrResult.content,
            }),
          });

          if (response.ok) {
            const suggestions = await response.json();
            setLinkSuggestions(suggestions.data || []);
          }
        } catch (err) {
          console.error('Failed to fetch link suggestions:', err);
        }
      }

      // Open the review modal
      setShowOCRReview(true);
    },
    []
  );

  // Handle OCR save
  const handleOCRSave = useCallback(
    async (data: {
      content: string;
      date: string | null;
      ticker: string | null;
      mood: string | null;
      thesisTradeId: string | null;
      ocrConfidence: number;
    }): Promise<void> => {
      // Wrap everything in try-catch to ensure errors propagate
      try {
        const entryData = {
          content: data.content,
          type: 'REFLECTION' as const,
          mood: data.mood || 'NEUTRAL',
          conviction: 'MEDIUM',
          ticker: data.ticker || undefined,
          imageUrls: ocrImageUrl ? [ocrImageUrl] : undefined,
          captureMethod: 'JOURNAL_SCAN',
          isOcrScanned: true,
          ocrConfidence: data.ocrConfidence,
          thesisTradeId: data.thesisTradeId || undefined,
          createdAt: data.date || undefined,
        };

        const response = await fetch('/api/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entryData),
        });

        if (!response.ok) {
          const responseData = await response.json();
          throw new Error(responseData.error || 'Failed to create entry');
        }

        // Close and redirect
        onClose();
        router.push('/journal');
        router.refresh();
      } catch (err) {
        // Re-throw with more context if it's not already an Error
        if (err instanceof Error) {
          throw err;
        }
        throw new Error(`Save failed: ${String(err)}`);
      }
    },
    [ocrImageUrl, onClose, router]
  );

  // Handle OCR retry
  const handleOCRRetry = useCallback(() => {
    setShowOCRReview(false);
    setOcrResult(null);
    setOcrImageUrl(null);
    setOcrWarnings([]);
    setLinkSuggestions([]);
    setShowJournalScanner(true);
  }, []);

  // Remove an image
  const removeImage = useCallback((index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    setImageAnalyses((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Auto-infer metadata when content changes
  const inferMetadata = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 10) {
      setInferred(null);
      return;
    }

    try {
      setSubmitState('inferring');
      const response = await fetch('/api/infer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });

      if (!response.ok) {
        throw new Error('Failed to infer metadata');
      }

      const data: InferredMetadata = await response.json();
      setInferred(data);
      setSubmitState('idle');
    } catch (err) {
      console.error('Inference error:', err);
      setSubmitState('idle');
      // Don't show error - inference is optional
    }
  }, []);

  // Debounced inference on content change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.trim().length >= 10) {
        inferMetadata(content);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [content, inferMetadata]);

  // Extract tickers from content
  const extractTickers = useCallback((text: string): string[] => {
    const tickers = new Set<string>();
    let match;
    const regex = new RegExp(TICKER_REGEX.source, 'gi');
    while ((match = regex.exec(text)) !== null) {
      const t = (match[1] || match[2])?.toUpperCase();
      if (t && t.length >= 2 && t.length <= 5) {
        // Skip common words that aren't tickers
        const skipWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT'];
        if (!skipWords.includes(t)) {
          tickers.add(t);
        }
      }
    }
    // Also check for explicit ticker override
    if (ticker) {
      tickers.add(ticker.toUpperCase());
    }
    return Array.from(tickers);
  }, [ticker]);

  // Debounced link suggestion fetching when tickers detected
  useEffect(() => {
    // Don't fetch if dismissed or already in OCR flow
    if (linkDismissed || showOCRReview || showJournalScanner) {
      return;
    }

    const detectedTickers = extractTickers(content);

    if (detectedTickers.length === 0) {
      setInlineLinkSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/journal/link-suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tickers: detectedTickers,
            date: new Date().toISOString(),
            content: content,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setInlineLinkSuggestions(data.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch inline link suggestions:', err);
      }
    }, 1500); // Slightly longer debounce for link suggestions

    return () => clearTimeout(timer);
  }, [content, linkDismissed, showOCRReview, showJournalScanner, extractTickers]);

  // Get effective values (override or inferred)
  const effectiveType = entryType || inferred?.entryType || 'OBSERVATION';
  const effectiveMood = mood || inferred?.mood || 'NEUTRAL';
  const effectiveConviction = conviction || inferred?.conviction || 'MEDIUM';
  const effectiveTicker = ticker !== null ? ticker : inferred?.ticker;

  // Submit entry
  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setSubmitState('submitting');
    setError(null);

    try {
      // Upload audio if present
      let uploadedAudioUrl: string | undefined;
      if (audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');
        if (audioDuration) {
          formData.append('duration', audioDuration.toString());
        }

        const uploadResponse = await fetch('/api/upload/audio', {
          method: 'POST',
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          uploadedAudioUrl = uploadData.url;
        }
      }

      // Determine capture method
      let captureMethod = 'QUICK_CAPTURE';
      if (audioBlob) {
        captureMethod = 'VOICE';
      } else if (imageUrls.length > 0) {
        captureMethod = 'SCREENSHOT';
      }

      // Create the entry
      const entryData = {
        content: content.trim(),
        type: effectiveType,
        mood: effectiveMood,
        conviction: effectiveConviction,
        ticker: effectiveTicker || undefined,
        audioUrl: uploadedAudioUrl,
        audioDuration: audioDuration || undefined,
        transcription: transcription || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        imageAnalyses: imageAnalyses.filter(Boolean).length > 0 ? imageAnalyses : undefined,
        captureMethod,
        thesisTradeId: selectedTradeId || undefined,
      };

      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create entry');
      }

      const responseData = await response.json();
      setSubmitState('success');

      // Check if trade was detected with sufficient confidence
      if (responseData.tradeDetection?.detected && responseData.entry?.id) {
        const td = responseData.tradeDetection;
        // Show trade detection prompt instead of closing
        setSavedEntryId(responseData.entry.id);
        setTradeDetection({
          detected: true,
          confidence: td.confidence,
          signals: {
            ticker: td.signals.ticker || null,
            tickerConfidence: td.signals.tickerConfidence ?? 0,
            action: td.signals.action || null,
            actionConfidence: td.signals.actionConfidence ?? 0,
            outcome: td.signals.outcome || null,
            outcomeConfidence: td.signals.outcomeConfidence ?? 0,
            approximatePnL: td.signals.approximatePnL ?? null,
            pnlConfidence: td.signals.pnlConfidence ?? 0,
          },
          evidenceQuote: td.evidenceQuote || null,
        });
        setShowTradePrompt(true);
      } else {
        // Close and redirect normally
        setTimeout(() => {
          onClose();
          router.push('/journal');
          router.refresh();
        }, 500);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save entry');
      setSubmitState('error');
    }
  };

  // Handle logging trade from detection prompt
  const handleLogTrade = async (
    outcome: TradeOutcome,
    options?: { ticker?: string; pnl?: number }
  ) => {
    if (!savedEntryId) return;

    const response = await fetch(`/api/entries/${savedEntryId}/log-trade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        outcome,
        ticker: options?.ticker,
        approximatePnL: options?.pnl,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to log trade');
    }

    // Success - close and redirect
    setShowTradePrompt(false);
    onClose();
    router.push('/trades');
    router.refresh();
  };

  // Handle dismissing trade detection prompt
  const handleDismissTradePrompt = () => {
    setShowTradePrompt(false);
    onClose();
    router.push('/journal');
    router.refresh();
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Swipe-to-dismiss state
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragVelocity = useRef(0);
  const lastDragY = useRef(0);
  const lastDragTime = useRef(0);

  const handleDragStart = useCallback((clientY: number) => {
    dragStartY.current = clientY;
    lastDragY.current = clientY;
    lastDragTime.current = Date.now();
    dragVelocity.current = 0;
    setIsDragging(true);
  }, []);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;
    const delta = Math.max(0, clientY - dragStartY.current);

    // Track velocity
    const now = Date.now();
    const dt = now - lastDragTime.current;
    if (dt > 0) {
      dragVelocity.current = (clientY - lastDragY.current) / dt;
    }
    lastDragY.current = clientY;
    lastDragTime.current = now;

    setDragY(delta);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    // Close if dragged far enough or fast enough
    if (dragY > 120 || dragVelocity.current > 0.5) {
      onClose();
    }
    setDragY(0);
  }, [isDragging, dragY, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        style={{ opacity: isDragging ? Math.max(0.1, 1 - dragY / 300) : undefined }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        className={cn(
          'relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl shadow-xl',
          'max-h-[90vh] overflow-hidden flex flex-col',
          dragY === 0 && 'animate-in slide-in-from-bottom duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-capture-title"
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-0 sm:hidden cursor-grab active:cursor-grabbing touch-none"
          onTouchStart={(e) => handleDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => handleDragMove(e.touches[0].clientY)}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="p-4 pt-2 sm:pt-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 id="quick-capture-title" className="text-lg font-semibold">
              Quick Capture
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Tab switcher — hide when in voice preview mode */}
          {!voicePreviewMode && (
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'journal'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid="journal-tab"
              >
                Journal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('quick-trade')}
                className={cn(
                  'flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  activeTab === 'quick-trade'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid="quick-trade-tab"
              >
                Quick Trade
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Quick Trade Tab Content */}
          {activeTab === 'quick-trade' && !voicePreviewMode && (
            <QuickTradeCapture
              defaultTicker={effectiveTicker || undefined}
              onTradeCreated={() => {
                onClose();
                router.push('/trades');
                router.refresh();
              }}
              onCancel={onClose}
            />
          )}

          {/* Journal Tab Content */}
          {activeTab === 'journal' && (
            <>
              {/* Voice + Trade Preview (shown immediately after voice recording if trade detected) */}
              {voicePreviewMode && voiceDetection && voiceTranscription ? (
                <VoiceCapturePreview
                  transcription={voiceTranscription}
                  tradeDetection={voiceDetection}
                  audioUrl={voiceAudioUrl || undefined}
                  audioDuration={voiceAudioDuration || undefined}
                  onSaveBoth={handleVoiceSaveBoth}
                  onSaveEntryOnly={handleVoiceSaveEntryOnly}
                  onEdit={() => {
                    setVoicePreviewMode(false);
                    setContent(voiceTranscription);
                  }}
                  onCancel={() => {
                    setVoicePreviewMode(false);
                    onClose();
                  }}
                />
              ) : (
                <>
                  {/* Main textarea */}
                  <div className="space-y-2">
                    <Label htmlFor="quick-content" className="sr-only">
                      What&apos;s on your mind?
                    </Label>
                    <Textarea
                      ref={textareaRef}
                      id="quick-content"
                      placeholder="What's on your mind? Just start typing..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="min-h-[120px] resize-none text-base"
                    />
                  </div>

                  {/* Voice recorder */}
                  {showVoice && (
                    <div className="flex justify-center py-4">
                      <VoiceRecorder
                        onRecordingComplete={handleRecordingComplete}
                        onError={(err) => setError(err)}
                      />
                    </div>
                  )}

                  {/* Detecting trades indicator */}
                  {isDetecting && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing for trades...
                    </div>
                  )}

                  {/* Audio player (if recording exists) */}
                  {audioUrl && !showVoice && !isDetecting && (
                    <AudioPlayer src={audioUrl} duration={audioDuration || undefined} />
                  )}

                  {/* Image capture */}
                  {showImage && (
                    <div className="flex justify-center py-4">
                      <ImageCapture
                        onImageCapture={handleImageCapture}
                        onError={(err) => setError(err)}
                        maxImages={5}
                        mode="chart"
                      />
                    </div>
                  )}

                  {/* Journal scanner */}
                  {showJournalScanner && (
                    <div className="flex justify-center py-4">
                      <ImageCapture
                        onImageCapture={handleImageCapture}
                        onJournalScan={handleJournalScan}
                        onError={(err) => setError(err)}
                        mode="journal"
                      />
                    </div>
                  )}

                  {/* Image previews */}
                  {imageUrls.length > 0 && !showImage && (
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.map((url, index) => (
                        <div key={url} className="relative group">
                          {/* Using native img for blob URL preview - Next/Image requires explicit dimensions and doesn't support blob URLs */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Screenshot ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          {imageAnalyses[index] && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 rounded-b-lg truncate">
                              {imageAnalyses[index]?.ticker || 'Analyzed'}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inline trade link suggestions */}
                  {inlineLinkSuggestions.length > 0 && !linkDismissed && !selectedTradeId && (
                    <TradeLinkSuggestions
                      suggestions={inlineLinkSuggestions}
                      onLink={(tradeId) => setSelectedTradeId(tradeId)}
                      onDismiss={() => setLinkDismissed(true)}
                      mode="inline"
                    />
                  )}

                  {/* Selected trade indicator */}
                  {selectedTradeId && inlineLinkSuggestions.length > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-primary/10">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Linked to </span>
                          <span className="font-medium">
                            {inlineLinkSuggestions.find(s => s.tradeId === selectedTradeId)?.thesisName || 'trade'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTradeId(null);
                          setLinkDismissed(false);
                        }}
                        className="h-7 text-xs"
                      >
                        Change
                      </Button>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant={showVoice ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowVoice(!showVoice);
                        setShowImage(false);
                        setShowJournalScanner(false);
                      }}
                      className="gap-2"
                    >
                      <Mic className="h-4 w-4" />
                      Voice
                    </Button>

                    <Button
                      type="button"
                      variant={showImage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowImage(!showImage);
                        setShowVoice(false);
                        setShowJournalScanner(false);
                      }}
                      className="gap-2"
                      disabled={imageUrls.length >= 5}
                    >
                      <Camera className="h-4 w-4" />
                      Photo {imageUrls.length > 0 && `(${imageUrls.length})`}
                    </Button>

                    <Button
                      type="button"
                      variant={showJournalScanner ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setShowJournalScanner(!showJournalScanner);
                        setShowVoice(false);
                        setShowImage(false);
                      }}
                      className="gap-2"
                    >
                      <ScanText className="h-4 w-4" />
                      Scan Journal
                    </Button>

                    <div className="flex-1" />

                    {/* Inference indicator */}
                    <div aria-live="polite" aria-atomic="true" className="contents">
                      {submitState === 'inferring' && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          <span>Analyzing...</span>
                        </Badge>
                      )}

                      {inferred && submitState !== 'inferring' && (
                        <Badge variant="outline" className="gap-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Auto-detected</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Inferred/editable metadata */}
                  {(inferred || showDetails) && (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showDetails ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                        {showDetails ? 'Hide' : 'Show'} details
                      </button>

                      {showDetails && (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Entry Type */}
                          <div className="space-y-1">
                            <Label htmlFor="entry-type" className="text-xs">
                              Type
                            </Label>
                            <Select
                              value={effectiveType}
                              onValueChange={setEntryType}
                            >
                              <SelectTrigger id="entry-type" className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(ENTRY_TYPE_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Mood */}
                          <div className="space-y-1">
                            <Label htmlFor="mood" className="text-xs">
                              Mood
                            </Label>
                            <Select value={effectiveMood} onValueChange={setMood}>
                              <SelectTrigger id="mood" className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(MOOD_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Conviction */}
                          <div className="space-y-1">
                            <Label htmlFor="conviction" className="text-xs">
                              Conviction
                            </Label>
                            <Select
                              value={effectiveConviction}
                              onValueChange={setConviction}
                            >
                              <SelectTrigger id="conviction" className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(CONVICTION_LABELS).map(([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Ticker */}
                          <div className="space-y-1">
                            <Label htmlFor="ticker" className="text-xs">
                              Ticker
                            </Label>
                            <input
                              id="ticker"
                              type="text"
                              value={effectiveTicker || ''}
                              onChange={(e) => setTicker(e.target.value.toUpperCase())}
                              placeholder="e.g., AAPL"
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              maxLength={5}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trade Detection Prompt (PRD-B — for text entries) */}
                  {showTradePrompt && tradeDetection && savedEntryId && (
                    <TradeDetectionPrompt
                      detection={tradeDetection}
                      entryId={savedEntryId}
                      onLogTrade={handleLogTrade}
                      onDismiss={handleDismissTradePrompt}
                    />
                  )}

                  {/* Error message */}
                  {error && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer - hide when trade prompt shown, voice preview mode, or on quick-trade tab */}
        {activeTab === 'journal' && !showTradePrompt && !voicePreviewMode && (
          <div className="p-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={
                !content.trim() ||
                submitState === 'submitting' ||
                submitState === 'success'
              }
              className="w-full h-12 text-base gap-2"
            >
              {submitState === 'submitting' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : submitState === 'success' ? (
                <>
                  Saved!
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Save Entry
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* OCR Review Modal */}
      {ocrResult && (
        <OCRReviewModal
          isOpen={showOCRReview}
          onClose={() => {
            setShowOCRReview(false);
            setOcrResult(null);
            setOcrImageUrl(null);
            setOcrWarnings([]);
            setLinkSuggestions([]);
          }}
          ocrResult={ocrResult}
          imageUrl={ocrImageUrl || ''}
          linkSuggestions={linkSuggestions}
          warnings={ocrWarnings}
          onSave={handleOCRSave}
          onRetry={handleOCRRetry}
        />
      )}
    </div>
  );
}

// Default export for backward compatibility
export default QuickCapture;
