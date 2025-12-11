'use client';

import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Send, Mic, Loader2, Brain, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import VoiceRecorder from '@/components/VoiceRecorder';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

// Message types
interface EntryReference {
  id: string;
  type: 'TRADE_IDEA' | 'TRADE' | 'REFLECTION' | 'OBSERVATION';
  content: string;
  ticker?: string | null;
  createdAt: string;
}

interface Message {
  id: string;
  role: 'coach' | 'user';
  content: string;
  timestamp: Date;
  entryReferences?: EntryReference[];
}

interface CoachChatProps {
  initialMessages?: Message[];
  onSendMessage?: (message: string) => Promise<Message | null>;
  suggestedPrompts?: string[];
  className?: string;
}

const TYPE_COLORS: Record<string, string> = {
  TRADE_IDEA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  TRADE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  REFLECTION: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  OBSERVATION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

// Entry reference card shown inline with coach messages
function EntryReferenceCard({ entry }: { entry: EntryReference }) {
  const typeLabel = entry.type.charAt(0) + entry.type.slice(1).toLowerCase().replace('_', ' ');

  return (
    <Link href={`/journal/${entry.id}`}>
      <div
        className={cn(
          'mt-2 p-3 rounded-xl',
          'bg-white/50 dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50',
          'hover:bg-white dark:hover:bg-slate-800',
          'transition-colors cursor-pointer',
          'group'
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className={cn('text-xs', TYPE_COLORS[entry.type])}>
                {typeLabel}
              </Badge>
              {entry.ticker && (
                <Badge variant="outline" className="font-mono text-xs">
                  ${entry.ticker}
                </Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
              {entry.content}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </div>
      </div>
    </Link>
  );
}

// Single message bubble
function MessageBubble({ message }: { message: Message }) {
  const isCoach = message.role === 'coach';

  return (
    <div
      className={cn(
        'flex gap-3',
        isCoach ? 'justify-start' : 'justify-end'
      )}
    >
      {/* Coach avatar */}
      {isCoach && (
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-full',
            'bg-gradient-to-br from-amber-400 to-orange-500',
            'flex items-center justify-center',
            'shadow-md'
          )}
          aria-hidden="true"
        >
          <Brain className="h-5 w-5 text-white" />
        </div>
      )}

      {/* Message content */}
      <div
        className={cn(
          'max-w-[80%] min-w-[120px]',
          isCoach ? 'order-2' : 'order-1'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isCoach
              ? 'bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-tl-md'
              : 'bg-amber-500 text-white rounded-tr-md'
          )}
        >
          <p
            className={cn(
              'text-sm leading-relaxed whitespace-pre-wrap',
              isCoach ? 'text-slate-700 dark:text-slate-200' : 'text-white'
            )}
          >
            {message.content}
          </p>
        </div>

        {/* Entry references (coach messages only) */}
        {isCoach && message.entryReferences && message.entryReferences.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.entryReferences.map((entry) => (
              <EntryReferenceCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'text-xs text-slate-400 dark:text-slate-500 mt-1',
            isCoach ? 'text-left' : 'text-right'
          )}
        >
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full',
          'bg-gradient-to-br from-amber-400 to-orange-500',
          'flex items-center justify-center',
          'shadow-md'
        )}
        aria-hidden="true"
      >
        <Brain className="h-5 w-5 text-white" />
      </div>
      <div
        className={cn(
          'rounded-2xl rounded-tl-md px-4 py-3',
          'bg-white dark:bg-slate-800',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}
      >
        <div className="flex gap-1.5 items-center" aria-label="Coach is typing">
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Suggested quick reply buttons
function SuggestedPrompts({
  prompts,
  onSelect,
  disabled,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  if (prompts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/50">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className={cn(
            'px-3 py-2 rounded-xl text-sm',
            'bg-white dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
            'text-slate-600 dark:text-slate-300',
            'hover:bg-slate-100 dark:hover:bg-slate-700',
            'hover:border-amber-300 dark:hover:border-amber-700',
            'transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[44px]'
          )}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export default function CoachChat({
  initialMessages = [],
  onSendMessage,
  suggestedPrompts = [
    'How was my trading week?',
    'Show me my biases',
    'Pre-trade checklist',
    'Review my last trade',
  ],
  className,
}: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Send message handler
  const handleSendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (onSendMessage) {
        const response = await onSendMessage(trimmedMessage);
        if (response) {
          setMessages((prev) => [...prev, response]);
        }
      } else {
        // Default mock response for development
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const coachMessage: Message = {
          id: `coach-${Date.now()}`,
          role: 'coach',
          content: `I received your message: "${trimmedMessage}". Let me analyze your trading patterns and provide personalized insights.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, coachMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'coach',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Handle voice recording completion
  const handleVoiceComplete = (data: { transcription: string }) => {
    setShowVoiceInput(false);
    if (data.transcription) {
      handleSendMessage(data.transcription);
    }
  };

  // Handle suggested prompt selection
  const handlePromptSelect = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div
      className={cn(
        'flex flex-col h-full',
        'bg-slate-50 dark:bg-slate-900',
        className
      )}
    >
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div
              className={cn(
                'w-20 h-20 rounded-full mb-6',
                'bg-gradient-to-br from-amber-400 to-orange-500',
                'flex items-center justify-center',
                'shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30'
              )}
            >
              <Brain className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Trading Coach
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Ask me about your trading patterns, get pre-trade checks, or discuss your psychology.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <SuggestedPrompts
          prompts={suggestedPrompts}
          onSelect={handlePromptSelect}
          disabled={isLoading}
        />
      )}

      {/* Voice recorder overlay */}
      {showVoiceInput && (
        <div
          className={cn(
            'absolute inset-0 z-20',
            'bg-white/95 dark:bg-slate-900/95',
            'backdrop-blur-sm',
            'flex flex-col items-center justify-center gap-4',
            'animate-fade-in'
          )}
        >
          <VoiceRecorder
            onRecordingComplete={handleVoiceComplete}
            onError={() => setShowVoiceInput(false)}
          />
          <Button
            variant="ghost"
            onClick={() => setShowVoiceInput(false)}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-4 pb-safe">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          {/* Voice input button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowVoiceInput(true)}
            disabled={isLoading}
            className="flex-shrink-0 min-h-[44px] min-w-[44px]"
            aria-label="Start voice input"
          >
            <Mic className="h-5 w-5" />
          </Button>

          {/* Text input */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your trading coach..."
            disabled={isLoading}
            className={cn(
              'flex-1 min-h-[44px]',
              'rounded-xl',
              'border-slate-200 dark:border-slate-700',
              'focus:border-amber-500 focus:ring-amber-500'
            )}
            aria-label="Message input"
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={cn(
              'flex-shrink-0 min-h-[44px] min-w-[44px]',
              'bg-amber-500 hover:bg-amber-600',
              'rounded-xl'
            )}
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

export type { Message, EntryReference, CoachChatProps };
