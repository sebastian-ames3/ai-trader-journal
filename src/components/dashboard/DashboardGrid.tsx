'use client';

import * as React from 'react';
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Edit2, Check, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Widget, WidgetProps } from './Widget';

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';

export interface WidgetConfig {
  id: string;
  type: string;
  size: WidgetSize;
  position: number;
  settings?: Record<string, unknown>;
}

interface DashboardGridProps {
  widgets: WidgetConfig[];
  onWidgetsChange: (widgets: WidgetConfig[]) => void;
  onAddWidget?: () => void;
  renderWidget: (config: WidgetConfig, isEditMode: boolean) => React.ReactNode;
  className?: string;
}

/**
 * Widget size to grid column mapping
 * Small: 4 cols desktop, 6 tablet, 12 mobile
 * Medium: 4 cols desktop, 6 tablet, 12 mobile
 * Large: 8 cols desktop, 12 tablet, 12 mobile
 * Full: 12 cols all sizes
 */
const SIZE_CLASSES: Record<WidgetSize, string> = {
  small: 'col-span-12 sm:col-span-6 md:col-span-4',
  medium: 'col-span-12 sm:col-span-6 md:col-span-4',
  large: 'col-span-12 md:col-span-8',
  full: 'col-span-12',
};

const ROW_HEIGHTS: Record<WidgetSize, string> = {
  small: 'min-h-[160px]',
  medium: 'min-h-[200px]',
  large: 'min-h-[280px]',
  full: 'min-h-[280px]',
};

export function DashboardGrid({
  widgets,
  onWidgetsChange,
  onAddWidget,
  renderWidget,
  className,
}: DashboardGridProps) {
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Configure sensors for mouse and touch
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      const oldIndex = widgets.findIndex((w) => w.id === active.id);
      const newIndex = widgets.findIndex((w) => w.id === over.id);

      const newWidgets = arrayMove(widgets, oldIndex, newIndex).map((w, i) => ({
        ...w,
        position: i,
      }));

      onWidgetsChange(newWidgets);
    }
  };

  const handleRemoveWidget = (widgetId: string) => {
    const newWidgets = widgets
      .filter((w) => w.id !== widgetId)
      .map((w, i) => ({ ...w, position: i }));
    onWidgetsChange(newWidgets);
  };

  const handleWidgetSizeChange = (widgetId: string, size: WidgetSize) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, size } : w
    );
    onWidgetsChange(newWidgets);
  };

  const handleWidgetSettingsChange = (
    widgetId: string,
    settings: Record<string, unknown>
  ) => {
    const newWidgets = widgets.map((w) =>
      w.id === widgetId ? { ...w, settings: { ...w.settings, ...settings } } : w
    );
    onWidgetsChange(newWidgets);
  };

  const activeWidget = activeId
    ? widgets.find((w) => w.id === activeId)
    : null;

  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Edit Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          My Dashboard
        </h2>
        <div className="flex items-center gap-2">
          {isEditMode && onAddWidget && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWidget}
              className="min-h-[44px] gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Widget
            </Button>
          )}
          <Button
            variant={isEditMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="min-h-[44px] gap-2"
            aria-label={isEditMode ? 'Done editing' : 'Edit dashboard'}
          >
            {isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedWidgets.map((w) => w.id)}
          strategy={rectSortingStrategy}
          disabled={!isEditMode}
        >
          <div className="grid grid-cols-12 gap-4">
            {sortedWidgets.map((widget) => (
              <div
                key={widget.id}
                className={cn(SIZE_CLASSES[widget.size], ROW_HEIGHTS[widget.size])}
              >
                <Widget
                  id={widget.id}
                  isEditMode={isEditMode}
                  size={widget.size}
                  onRemove={() => handleRemoveWidget(widget.id)}
                  onSizeChange={(size) => handleWidgetSizeChange(widget.id, size)}
                  onSettingsChange={(settings) =>
                    handleWidgetSettingsChange(widget.id, settings)
                  }
                >
                  {renderWidget(widget, isEditMode)}
                </Widget>
              </div>
            ))}
          </div>
        </SortableContext>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeWidget ? (
            <div
              className={cn(
                'bg-white dark:bg-slate-800 rounded-2xl shadow-xl opacity-80',
                'border-2 border-amber-500',
                'p-4',
                SIZE_CLASSES[activeWidget.size],
                ROW_HEIGHTS[activeWidget.size]
              )}
            >
              <div className="h-full flex items-center justify-center text-slate-400">
                Dragging...
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Empty state */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-4xl mb-4">
            <span role="img" aria-label="Dashboard">
              &#128202;
            </span>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
            No widgets yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Add widgets to customize your dashboard
          </p>
          {onAddWidget && (
            <Button onClick={onAddWidget} className="min-h-[44px] gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Widget
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Export types for use in other components
export type { WidgetProps };
