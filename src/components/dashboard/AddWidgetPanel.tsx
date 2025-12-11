'use client';

import * as React from 'react';
import { X, Plus, Mic, Calendar, Brain, FileText, Smile, AlertTriangle, Target, MessageCircle, Activity, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WidgetSize } from './DashboardGrid';

interface WidgetDefinition {
  type: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  defaultSize: WidgetSize;
}

interface AddWidgetPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string, defaultSize: WidgetSize) => void;
  existingWidgetTypes?: string[];
}

const WIDGET_DEFINITIONS: WidgetDefinition[] = [
  // Capture & Actions
  {
    type: 'quickCapture',
    name: 'Quick Capture',
    description: 'Fast entry with voice, photo, or text',
    icon: Mic,
    category: 'Actions',
    defaultSize: 'medium',
  },
  // Insights & Analytics
  {
    type: 'streak',
    name: 'Journaling Streak',
    description: 'Track your daily journaling habit',
    icon: Calendar,
    category: 'Insights',
    defaultSize: 'medium',
  },
  {
    type: 'weeklyInsights',
    name: 'Weekly Insights',
    description: 'This week\'s stats and AI insights',
    icon: Brain,
    category: 'Insights',
    defaultSize: 'medium',
  },
  {
    type: 'moodTrend',
    name: 'Mood Trends',
    description: 'Track emotional patterns over time',
    icon: Smile,
    category: 'Insights',
    defaultSize: 'medium',
  },
  {
    type: 'biasTracker',
    name: 'Bias Tracker',
    description: 'Monitor detected cognitive biases',
    icon: AlertTriangle,
    category: 'Insights',
    defaultSize: 'medium',
  },
  // Content
  {
    type: 'recentEntries',
    name: 'Recent Entries',
    description: 'Quick access to your latest entries',
    icon: FileText,
    category: 'Content',
    defaultSize: 'medium',
  },
  {
    type: 'activeTheses',
    name: 'Trading Theses',
    description: 'View and manage active theses',
    icon: TrendingUp,
    category: 'Content',
    defaultSize: 'medium',
  },
  // Goals & Coach
  {
    type: 'goalsProgress',
    name: 'Goals Progress',
    description: 'Track progress toward your goals',
    icon: Target,
    category: 'Goals',
    defaultSize: 'medium',
  },
  {
    type: 'coachPrompt',
    name: 'AI Coach Prompt',
    description: 'Daily reflection prompts from AI',
    icon: MessageCircle,
    category: 'Goals',
    defaultSize: 'medium',
  },
  // Market
  {
    type: 'marketConditions',
    name: 'Market Conditions',
    description: 'SPY, VIX, and market alerts',
    icon: Activity,
    category: 'Market',
    defaultSize: 'medium',
  },
];

// Group widgets by category
function groupByCategory(widgets: WidgetDefinition[]): Record<string, WidgetDefinition[]> {
  return widgets.reduce((acc, widget) => {
    if (!acc[widget.category]) {
      acc[widget.category] = [];
    }
    acc[widget.category].push(widget);
    return acc;
  }, {} as Record<string, WidgetDefinition[]>);
}

export function AddWidgetPanel({
  isOpen,
  onClose,
  onAddWidget,
  existingWidgetTypes = [],
}: AddWidgetPanelProps) {
  const groupedWidgets = React.useMemo(
    () => groupByCategory(WIDGET_DEFINITIONS),
    []
  );

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          'relative w-full max-w-lg mx-4',
          'bg-background rounded-t-2xl sm:rounded-2xl shadow-xl',
          'max-h-[80vh] overflow-hidden flex flex-col',
          'animate-in slide-in-from-bottom duration-300'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-widget-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2
            id="add-widget-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Add Widget
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {Object.entries(groupedWidgets).map(([category, widgets]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                {category}
              </h3>
              <div className="space-y-2">
                {widgets.map((widget) => {
                  const isAdded = existingWidgetTypes.includes(widget.type);
                  const IconComponent = widget.icon;

                  return (
                    <button
                      key={widget.type}
                      onClick={() => {
                        if (!isAdded) {
                          onAddWidget(widget.type, widget.defaultSize);
                          onClose();
                        }
                      }}
                      disabled={isAdded}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-xl',
                        'text-left transition-all',
                        'min-h-[64px]',
                        isAdded
                          ? 'bg-slate-100 dark:bg-slate-800/30 opacity-50 cursor-not-allowed'
                          : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:shadow-sm'
                      )}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-xl',
                          'flex items-center justify-center',
                          isAdded
                            ? 'bg-slate-200 dark:bg-slate-700'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                        )}
                      >
                        <IconComponent
                          className={cn(
                            'h-5 w-5',
                            isAdded
                              ? 'text-slate-400 dark:text-slate-500'
                              : 'text-amber-600 dark:text-amber-400'
                          )}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              'font-medium',
                              isAdded
                                ? 'text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-slate-100'
                            )}
                          >
                            {widget.name}
                          </p>
                          {isAdded && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                              Added
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-sm truncate',
                            isAdded
                              ? 'text-slate-400 dark:text-slate-600'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {widget.description}
                        </p>
                      </div>
                      {!isAdded && (
                        <Plus className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export widget definitions for use elsewhere
export { WIDGET_DEFINITIONS };
export type { WidgetDefinition };
