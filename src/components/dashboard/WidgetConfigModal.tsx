'use client';

import * as React from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { WidgetSize, WidgetConfig } from './DashboardGrid';

interface WidgetConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  widget: WidgetConfig | null;
  onSave: (widget: WidgetConfig) => void;
}

// Widget-specific option configurations
const WIDGET_OPTIONS: Record<string, { key: string; label: string; type: 'toggle' | 'select'; options?: { value: string; label: string }[] }[]> = {
  streak: [],
  quickCapture: [],
  weeklyInsights: [
    {
      key: 'showInsights',
      label: 'Show insights list',
      type: 'toggle',
    },
  ],
  recentEntries: [
    {
      key: 'maxEntries',
      label: 'Number of entries',
      type: 'select',
      options: [
        { value: '3', label: '3 entries' },
        { value: '5', label: '5 entries' },
        { value: '10', label: '10 entries' },
      ],
    },
  ],
  moodTrend: [
    {
      key: 'showChart',
      label: 'Show trend chart',
      type: 'toggle',
    },
  ],
  biasTracker: [
    {
      key: 'showTips',
      label: 'Show improvement tips',
      type: 'toggle',
    },
  ],
  goalsProgress: [],
  coachPrompt: [
    {
      key: 'category',
      label: 'Prompt category',
      type: 'select',
      options: [
        { value: 'mindset', label: 'Mindset Check' },
        { value: 'reflection', label: 'Reflection' },
        { value: 'preTrading', label: 'Pre-Trade' },
        { value: 'review', label: 'Review' },
      ],
    },
  ],
  marketConditions: [
    {
      key: 'showAlerts',
      label: 'Show market alerts',
      type: 'toggle',
    },
  ],
  activeTheses: [
    {
      key: 'maxTheses',
      label: 'Number of theses',
      type: 'select',
      options: [
        { value: '3', label: '3 theses' },
        { value: '5', label: '5 theses' },
      ],
    },
  ],
};

const SIZE_OPTIONS: { value: WidgetSize; label: string; description: string }[] = [
  { value: 'small', label: 'Small', description: '4 columns, compact' },
  { value: 'medium', label: 'Medium', description: '4 columns, standard' },
  { value: 'large', label: 'Large', description: '8 columns, expanded' },
  { value: 'full', label: 'Full Width', description: '12 columns, full row' },
];

export function WidgetConfigModal({
  isOpen,
  onClose,
  widget,
  onSave,
}: WidgetConfigModalProps) {
  const [size, setSize] = React.useState<WidgetSize>(widget?.size || 'medium');
  const [settings, setSettings] = React.useState<Record<string, unknown>>(
    widget?.settings || {}
  );

  // Reset state when widget changes
  React.useEffect(() => {
    if (widget) {
      setSize(widget.size);
      setSettings(widget.settings || {});
    }
  }, [widget]);

  const handleSave = () => {
    if (!widget) return;
    onSave({
      ...widget,
      size,
      settings,
    });
    onClose();
  };

  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelectChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

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

  if (!isOpen || !widget) return null;

  const widgetOptions = WIDGET_OPTIONS[widget.type] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={cn(
          'relative w-full max-w-md mx-4',
          'bg-background rounded-2xl shadow-xl',
          'animate-in slide-in-from-bottom-4 duration-200'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="widget-config-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2
            id="widget-config-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Widget Settings
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
        <div className="p-4 space-y-6">
          {/* Size Selector */}
          <div className="space-y-2">
            <Label htmlFor="widget-size">Widget Size</Label>
            <Select value={size} onValueChange={(val) => setSize(val as WidgetSize)}>
              <SelectTrigger id="widget-size" className="min-h-[44px]">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="min-h-[44px]"
                  >
                    <div>
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({option.description})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Widget-specific options */}
          {widgetOptions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
                Widget Options
              </h3>

              {widgetOptions.map((option) => (
                <div key={option.key}>
                  {option.type === 'toggle' ? (
                    <button
                      type="button"
                      onClick={() => handleToggle(option.key)}
                      className={cn(
                        'w-full flex items-center justify-between p-3 rounded-lg',
                        'bg-slate-50 dark:bg-slate-800/50',
                        'hover:bg-slate-100 dark:hover:bg-slate-700/50',
                        'transition-colors',
                        'min-h-[44px]'
                      )}
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {option.label}
                      </span>
                      <div
                        className={cn(
                          'w-10 h-6 rounded-full transition-colors',
                          'flex items-center',
                          settings[option.key]
                            ? 'bg-amber-500 justify-end'
                            : 'bg-slate-300 dark:bg-slate-600 justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'w-5 h-5 rounded-full bg-white shadow mx-0.5',
                            'transition-transform'
                          )}
                        />
                      </div>
                    </button>
                  ) : option.type === 'select' && option.options ? (
                    <div className="space-y-2">
                      <Label htmlFor={option.key}>{option.label}</Label>
                      <Select
                        value={(settings[option.key] as string) || option.options[0].value}
                        onValueChange={(val) => handleSelectChange(option.key, val)}
                      >
                        <SelectTrigger id={option.key} className="min-h-[44px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {option.options.map((opt) => (
                            <SelectItem
                              key={opt.value}
                              value={opt.value}
                              className="min-h-[44px]"
                            >
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            Cancel
          </Button>
          <Button onClick={handleSave} className="min-h-[44px] gap-2">
            <Check className="h-4 w-4" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
