'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Brain,
  History,
  Shield,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface RiskWarning {
  id: string;
  type: 'IV_RATIO' | 'POSITION_SIZE' | 'CORRELATION' | 'TIMING' | 'STREAK' | 'CUSTOM';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: {
    label: string;
    value: string | number;
    threshold?: string | number;
  };
  action?: string;
}

export interface HistoricalLesson {
  id: string;
  date: string;
  ticker: string;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN';
  lesson: string;
  pnl?: number;
  similarity: number;
}

export interface PatternInsight {
  id: string;
  pattern: string;
  description: string;
  trend: 'up' | 'down' | 'neutral';
  frequency: string;
}

interface AIRemindersProps {
  ticker: string;
  strategyType?: string;
  direction?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  warnings?: RiskWarning[];
  lessons?: HistoricalLesson[];
  patterns?: PatternInsight[];
  isLoading?: boolean;
  onAcknowledge: () => void;
  onReconsider: () => void;
  className?: string;
}

function getSeverityConfig(severity: RiskWarning['severity']) {
  switch (severity) {
    case 'high':
      return {
        variant: 'destructive' as const,
        icon: XCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
      };
    case 'medium':
      return {
        variant: 'warning' as const,
        icon: AlertTriangle,
        bgColor: 'bg-amber-50 dark:bg-amber-900/20',
        borderColor: 'border-amber-200 dark:border-amber-800',
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    case 'low':
      return {
        variant: 'info' as const,
        icon: Lightbulb,
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
      };
  }
}

function getTypeIcon(type: RiskWarning['type']) {
  switch (type) {
    case 'IV_RATIO':
      return TrendingUp;
    case 'POSITION_SIZE':
      return Shield;
    case 'CORRELATION':
      return Brain;
    case 'TIMING':
      return History;
    case 'STREAK':
      return TrendingDown;
    default:
      return AlertTriangle;
  }
}

export default function AIReminders({
  ticker,
  strategyType,
  direction,
  warnings = [],
  lessons = [],
  patterns = [],
  isLoading = false,
  onAcknowledge,
  onReconsider,
  className,
}: AIRemindersProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    warnings: true,
    lessons: false,
    patterns: false,
  });
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState<Set<string>>(new Set());

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const acknowledgeWarning = useCallback((warningId: string) => {
    setAcknowledgedWarnings((prev) => {
      const newSet = new Set(prev);
      newSet.add(warningId);
      return newSet;
    });
  }, []);

  // Count unacknowledged high-severity warnings
  const highSeverityCount = warnings.filter(
    (w) => w.severity === 'high' && !acknowledgedWarnings.has(w.id)
  ).length;

  const hasContent = warnings.length > 0 || lessons.length > 0 || patterns.length > 0;

  // Auto-expand warnings if there are high severity ones
  useEffect(() => {
    if (highSeverityCount > 0) {
      setExpandedSections((prev) => ({ ...prev, warnings: true }));
    }
  }, [highSeverityCount]);

  if (!hasContent && !isLoading) {
    return (
      <Card className={cn('border-green-200 dark:border-green-800', className)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                No warnings for this trade
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No historical patterns or risks detected for ${ticker}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="h-4 w-48 skeleton rounded" />
            <div className="h-20 skeleton rounded-lg" />
            <div className="h-16 skeleton rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="p-4 pb-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          AI Trade Review
          {highSeverityCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {highSeverityCount} Warning{highSeverityCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review before entering this {strategyType || 'trade'} on ${ticker}
          {direction && (
            <Badge variant="outline" className="ml-2 text-xs">
              {direction}
            </Badge>
          )}
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Risk Warnings Section */}
        {warnings.length > 0 && (
          <CollapsibleSection
            title="Risk Warnings"
            icon={<AlertTriangle className="h-4 w-4" />}
            count={warnings.length}
            isExpanded={expandedSections.warnings}
            onToggle={() => toggleSection('warnings')}
            badgeColor={highSeverityCount > 0 ? 'destructive' : 'secondary'}
          >
            <div className="space-y-3">
              {warnings.map((warning) => {
                const config = getSeverityConfig(warning.severity);
                const TypeIcon = getTypeIcon(warning.type);
                const isAcknowledged = acknowledgedWarnings.has(warning.id);

                return (
                  <Alert
                    key={warning.id}
                    variant={config.variant}
                    className={cn(
                      'transition-all',
                      isAcknowledged && 'opacity-50'
                    )}
                  >
                    <TypeIcon className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{warning.title}</span>
                      {!isAcknowledged && warning.severity === 'high' && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => acknowledgeWarning(warning.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </AlertTitle>
                    <AlertDescription className="mt-1">
                      <p>{warning.description}</p>
                      {warning.metric && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {warning.metric.label}: {warning.metric.value}
                            {warning.metric.threshold && (
                              <span className="text-slate-400 ml-1">
                                (threshold: {warning.metric.threshold})
                              </span>
                            )}
                          </Badge>
                        </div>
                      )}
                      {warning.action && (
                        <p className="mt-2 text-xs font-medium">
                          Suggestion: {warning.action}
                        </p>
                      )}
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* Historical Lessons Section */}
        {lessons.length > 0 && (
          <CollapsibleSection
            title="Past Lessons"
            icon={<History className="h-4 w-4" />}
            count={lessons.length}
            isExpanded={expandedSections.lessons}
            onToggle={() => toggleSection('lessons')}
          >
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className={cn(
                    'p-3 rounded-lg border',
                    lesson.outcome === 'WIN' && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
                    lesson.outcome === 'LOSS' && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                    lesson.outcome === 'BREAKEVEN' && 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={lesson.outcome === 'WIN' ? 'default' : lesson.outcome === 'LOSS' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        ${lesson.ticker}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(lesson.date).toLocaleDateString()}
                      </span>
                    </div>
                    {lesson.pnl !== undefined && (
                      <span
                        className={cn(
                          'text-sm font-medium',
                          lesson.pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        )}
                      >
                        {lesson.pnl >= 0 ? '+' : ''}${lesson.pnl.toFixed(0)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                    &ldquo;{lesson.lesson}&rdquo;
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs text-slate-400">Similarity:</span>
                    <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${lesson.similarity * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{Math.round(lesson.similarity * 100)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Pattern Insights Section */}
        {patterns.length > 0 && (
          <CollapsibleSection
            title="Pattern Insights"
            icon={<Lightbulb className="h-4 w-4" />}
            count={patterns.length}
            isExpanded={expandedSections.patterns}
            onToggle={() => toggleSection('patterns')}
          >
            <div className="space-y-2">
              {patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <div
                    className={cn(
                      'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                      pattern.trend === 'up' && 'bg-green-100 dark:bg-green-900/30',
                      pattern.trend === 'down' && 'bg-red-100 dark:bg-red-900/30',
                      pattern.trend === 'neutral' && 'bg-slate-200 dark:bg-slate-700'
                    )}
                  >
                    {pattern.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
                    {pattern.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
                    {pattern.trend === 'neutral' && <Brain className="h-4 w-4 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{pattern.pattern}</p>
                      <Badge variant="outline" className="text-xs">
                        {pattern.frequency}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {pattern.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-h-[44px]"
            onClick={onReconsider}
          >
            Reconsider Trade
          </Button>
          <Button
            type="button"
            className="flex-1 min-h-[44px]"
            onClick={onAcknowledge}
            disabled={highSeverityCount > 0}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Proceed
          </Button>
        </div>

        {highSeverityCount > 0 && (
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Acknowledge all high-severity warnings to proceed
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  badgeColor?: 'default' | 'secondary' | 'destructive';
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  icon,
  count,
  isExpanded,
  onToggle,
  badgeColor = 'secondary',
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium text-sm">{title}</span>
          <Badge variant={badgeColor} className="text-xs">
            {count}
          </Badge>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isExpanded && <div className="p-3 pt-0 mt-3">{children}</div>}
    </div>
  );
}
