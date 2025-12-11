'use client';

import * as React from 'react';
import { X, Check, Trash2, Edit2, Plus, Layout, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from './DashboardGrid';

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  isDefault?: boolean;
  createdAt: Date | string;
}

interface LayoutSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  layouts: DashboardLayout[];
  activeLayoutId: string;
  onSelectLayout: (layoutId: string) => void;
  onCreateLayout: (name: string, widgets: WidgetConfig[]) => void;
  onEditLayout: (layoutId: string, name: string) => void;
  onDeleteLayout: (layoutId: string) => void;
  onResetToDefault: () => void;
  currentWidgets: WidgetConfig[];
}

export function LayoutSwitcher({
  isOpen,
  onClose,
  layouts,
  activeLayoutId,
  onSelectLayout,
  onCreateLayout,
  onEditLayout,
  onDeleteLayout,
  onResetToDefault,
  currentWidgets,
}: LayoutSwitcherProps) {
  const [isCreating, setIsCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when creating/editing
  React.useEffect(() => {
    if ((isCreating || editingId) && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCreating, editingId]);

  const handleCreateLayout = () => {
    if (newName.trim()) {
      onCreateLayout(newName.trim(), currentWidgets);
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleEditLayout = (layoutId: string) => {
    if (newName.trim()) {
      onEditLayout(layoutId, newName.trim());
      setNewName('');
      setEditingId(null);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    action: 'create' | 'edit',
    layoutId?: string
  ) => {
    if (e.key === 'Enter') {
      if (action === 'create') {
        handleCreateLayout();
      } else if (action === 'edit' && layoutId) {
        handleEditLayout(layoutId);
      }
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setEditingId(null);
      setNewName('');
    }
  };

  // Handle escape key for modal
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isCreating && !editingId) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isCreating, editingId, onClose]);

  if (!isOpen) return null;

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
          'max-h-[80vh] overflow-hidden flex flex-col',
          'animate-in slide-in-from-bottom-4 duration-200'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="layout-switcher-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Layout className="h-5 w-5 text-slate-500" />
            <h2
              id="layout-switcher-title"
              className="text-lg font-semibold text-slate-900 dark:text-slate-100"
            >
              Dashboard Layouts
            </h2>
          </div>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {layouts.map((layout) => (
            <div
              key={layout.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                'transition-colors',
                layout.id === activeLayoutId
                  ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50'
              )}
            >
              {editingId === layout.id ? (
                <div className="flex-1 flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'edit', layout.id)}
                    placeholder="Layout name"
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg',
                      'border border-slate-200 dark:border-slate-600',
                      'bg-white dark:bg-slate-800',
                      'text-sm text-slate-900 dark:text-slate-100',
                      'focus:outline-none focus:ring-2 focus:ring-amber-500'
                    )}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleEditLayout(layout.id)}
                    className="min-h-[36px]"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setNewName('');
                    }}
                    className="min-h-[36px]"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  {/* Radio button */}
                  <button
                    onClick={() => onSelectLayout(layout.id)}
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2',
                      'flex items-center justify-center',
                      'transition-colors',
                      layout.id === activeLayoutId
                        ? 'border-amber-500 bg-amber-500'
                        : 'border-slate-300 dark:border-slate-600'
                    )}
                    aria-label={`Select ${layout.name} layout`}
                  >
                    {layout.id === activeLayoutId && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </button>

                  {/* Layout info */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => onSelectLayout(layout.id)}
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {layout.name}
                      </p>
                      {layout.isDefault && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {layout.widgets.length} widget{layout.widgets.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingId(layout.id);
                        setNewName(layout.name);
                      }}
                      className="h-8 w-8 p-0"
                      aria-label="Edit layout name"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {!layout.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteLayout(layout.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                        aria-label="Delete layout"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Create new layout */}
          {isCreating ? (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'create')}
                placeholder="New layout name"
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg',
                  'border border-slate-200 dark:border-slate-600',
                  'bg-white dark:bg-slate-800',
                  'text-sm text-slate-900 dark:text-slate-100',
                  'focus:outline-none focus:ring-2 focus:ring-amber-500'
                )}
              />
              <Button
                size="sm"
                onClick={handleCreateLayout}
                disabled={!newName.trim()}
                className="min-h-[36px]"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCreating(false);
                  setNewName('');
                }}
                className="min-h-[36px]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setIsCreating(true)}
              className={cn(
                'w-full min-h-[48px] justify-start gap-2',
                'border-dashed',
                'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              )}
            >
              <Plus className="h-4 w-4" />
              Save Current as New Layout
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="outline"
            onClick={onResetToDefault}
            className="w-full min-h-[44px] gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Default Layout
          </Button>
        </div>
      </div>
    </div>
  );
}

// Default layout for new users
export const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default',
  isDefault: true,
  createdAt: new Date().toISOString(),
  widgets: [
    { id: 'streak-1', type: 'streak', size: 'medium', position: 0 },
    { id: 'quickCapture-1', type: 'quickCapture', size: 'medium', position: 1 },
    { id: 'weeklyInsights-1', type: 'weeklyInsights', size: 'medium', position: 2 },
    { id: 'recentEntries-1', type: 'recentEntries', size: 'medium', position: 3 },
    { id: 'activeTheses-1', type: 'activeTheses', size: 'medium', position: 4 },
    { id: 'coachPrompt-1', type: 'coachPrompt', size: 'medium', position: 5 },
  ],
};
