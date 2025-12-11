'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layout, RotateCcw, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardGrid, WidgetConfig, WidgetSize } from '@/components/dashboard/DashboardGrid';
import { WidgetSkeleton } from '@/components/dashboard/Widget';
import { AddWidgetPanel } from '@/components/dashboard/AddWidgetPanel';
import { WidgetConfigModal } from '@/components/dashboard/WidgetConfigModal';
import { LayoutSwitcher, DashboardLayout, DEFAULT_LAYOUT } from '@/components/dashboard/LayoutSwitcher';
import { cn } from '@/lib/utils';

// Lazy load widgets for better performance
const QuickCaptureWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/QuickCaptureWidget').then((mod) => ({
    default: mod.QuickCaptureWidget,
  }))
);
const StreakWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/StreakWidget').then((mod) => ({
    default: mod.StreakWidget,
  }))
);
const WeeklyInsightsWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/WeeklyInsightsWidget').then((mod) => ({
    default: mod.WeeklyInsightsWidget,
  }))
);
const RecentEntriesWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/RecentEntriesWidget').then((mod) => ({
    default: mod.RecentEntriesWidget,
  }))
);
const MoodTrendWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/MoodTrendWidget').then((mod) => ({
    default: mod.MoodTrendWidget,
  }))
);
const BiasTrackerWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/BiasTrackerWidget').then((mod) => ({
    default: mod.BiasTrackerWidget,
  }))
);
const GoalsProgressWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/GoalsProgressWidget').then((mod) => ({
    default: mod.GoalsProgressWidget,
  }))
);
const CoachPromptWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/CoachPromptWidget').then((mod) => ({
    default: mod.CoachPromptWidget,
  }))
);
const MarketConditionsWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/MarketConditionsWidget').then((mod) => ({
    default: mod.MarketConditionsWidget,
  }))
);
const ActiveThesesWidget = React.lazy(() =>
  import('@/components/dashboard/widgets/ActiveThesesWidget').then((mod) => ({
    default: mod.ActiveThesesWidget,
  }))
);

// Storage keys
const WIDGETS_STORAGE_KEY = 'dashboard-widgets';
const LAYOUTS_STORAGE_KEY = 'dashboard-layouts';
const ACTIVE_LAYOUT_KEY = 'dashboard-active-layout';

export default function DashboardSettingsPage() {
  const router = useRouter();
  const [widgets, setWidgets] = React.useState<WidgetConfig[]>([]);
  const [layouts, setLayouts] = React.useState<DashboardLayout[]>([DEFAULT_LAYOUT]);
  const [activeLayoutId, setActiveLayoutId] = React.useState('default');
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);

  // Modal states
  const [showAddWidget, setShowAddWidget] = React.useState(false);
  const [showLayoutSwitcher, setShowLayoutSwitcher] = React.useState(false);
  const [configWidget, setConfigWidget] = React.useState<WidgetConfig | null>(null);

  // Load saved layouts and widgets from localStorage
  React.useEffect(() => {
    try {
      const savedLayouts = localStorage.getItem(LAYOUTS_STORAGE_KEY);
      const savedActiveLayout = localStorage.getItem(ACTIVE_LAYOUT_KEY);
      const savedWidgets = localStorage.getItem(WIDGETS_STORAGE_KEY);

      if (savedLayouts) {
        setLayouts(JSON.parse(savedLayouts));
      }
      if (savedActiveLayout) {
        setActiveLayoutId(savedActiveLayout);
      }
      if (savedWidgets) {
        setWidgets(JSON.parse(savedWidgets));
      } else {
        // Use default layout widgets
        setWidgets(DEFAULT_LAYOUT.widgets);
      }
    } catch (error) {
      console.error('Error loading dashboard settings:', error);
      setWidgets(DEFAULT_LAYOUT.widgets);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save to localStorage when widgets change
  const saveWidgets = React.useCallback((newWidgets: WidgetConfig[]) => {
    setWidgets(newWidgets);
    setHasUnsavedChanges(true);
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
      localStorage.setItem(LAYOUTS_STORAGE_KEY, JSON.stringify(layouts));
      localStorage.setItem(ACTIVE_LAYOUT_KEY, activeLayoutId);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving dashboard settings:', error);
    }
  };

  // Add new widget
  const handleAddWidget = (type: string, defaultSize: WidgetSize) => {
    const newWidget: WidgetConfig = {
      id: `${type}-${Date.now()}`,
      type,
      size: defaultSize,
      position: widgets.length,
    };
    saveWidgets([...widgets, newWidget]);
  };

  // Layout management
  const handleSelectLayout = (layoutId: string) => {
    const layout = layouts.find((l) => l.id === layoutId);
    if (layout) {
      setActiveLayoutId(layoutId);
      setWidgets(layout.widgets);
      setHasUnsavedChanges(true);
    }
  };

  const handleCreateLayout = (name: string, layoutWidgets: WidgetConfig[]) => {
    const newLayout: DashboardLayout = {
      id: `layout-${Date.now()}`,
      name,
      widgets: layoutWidgets,
      createdAt: new Date().toISOString(),
    };
    setLayouts([...layouts, newLayout]);
    setActiveLayoutId(newLayout.id);
    setHasUnsavedChanges(true);
  };

  const handleEditLayout = (layoutId: string, name: string) => {
    setLayouts(layouts.map((l) => (l.id === layoutId ? { ...l, name } : l)));
    setHasUnsavedChanges(true);
  };

  const handleDeleteLayout = (layoutId: string) => {
    setLayouts(layouts.filter((l) => l.id !== layoutId));
    if (activeLayoutId === layoutId) {
      setActiveLayoutId('default');
      setWidgets(DEFAULT_LAYOUT.widgets);
    }
    setHasUnsavedChanges(true);
  };

  const handleResetToDefault = () => {
    setWidgets(DEFAULT_LAYOUT.widgets);
    setActiveLayoutId('default');
    setHasUnsavedChanges(true);
  };

  // Render widget content
  const renderWidget = (config: WidgetConfig, isEditMode: boolean) => {
    return (
      <React.Suspense fallback={<WidgetSkeleton size={config.size} />}>
        {(() => {
          switch (config.type) {
            case 'quickCapture':
              return <QuickCaptureWidget />;
            case 'streak':
              return <StreakWidget currentStreak={0} longestStreak={0} />;
            case 'weeklyInsights':
              return <WeeklyInsightsWidget />;
            case 'recentEntries':
              return <RecentEntriesWidget entries={[]} />;
            case 'moodTrend':
              return <MoodTrendWidget />;
            case 'biasTracker':
              return <BiasTrackerWidget />;
            case 'goalsProgress':
              return <GoalsProgressWidget />;
            case 'coachPrompt':
              return <CoachPromptWidget />;
            case 'marketConditions':
              return <MarketConditionsWidget />;
            case 'activeTheses':
              return <ActiveThesesWidget />;
            default:
              return (
                <div className="h-full flex items-center justify-center text-slate-400">
                  Unknown widget: {config.type}
                </div>
              );
          }
        })()}
      </React.Suspense>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
        <div className="px-4 py-6">
          <div className="h-8 w-48 skeleton rounded mb-6" />
          <div className="grid grid-cols-12 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="col-span-12 sm:col-span-6 md:col-span-4 h-48 skeleton rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Go back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Customize Dashboard
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Drag widgets to reorder, add or remove as needed
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLayoutSwitcher(true)}
                className="min-h-[44px] gap-2 hidden sm:flex"
              >
                <Layout className="h-4 w-4" />
                Layouts
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasUnsavedChanges}
                size="sm"
                className={cn(
                  'min-h-[44px] gap-2',
                  hasUnsavedChanges && 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <DashboardGrid
          widgets={widgets}
          onWidgetsChange={saveWidgets}
          onAddWidget={() => setShowAddWidget(true)}
          renderWidget={renderWidget}
        />
      </div>

      {/* Mobile-only layout button */}
      <div className="sm:hidden fixed bottom-20 left-4 right-4">
        <Button
          variant="outline"
          onClick={() => setShowLayoutSwitcher(true)}
          className="w-full min-h-[48px] gap-2 bg-white dark:bg-slate-800 shadow-lg"
        >
          <Layout className="h-4 w-4" />
          Manage Layouts
        </Button>
      </div>

      {/* Modals */}
      <AddWidgetPanel
        isOpen={showAddWidget}
        onClose={() => setShowAddWidget(false)}
        onAddWidget={handleAddWidget}
        existingWidgetTypes={widgets.map((w) => w.type)}
      />

      <WidgetConfigModal
        isOpen={!!configWidget}
        onClose={() => setConfigWidget(null)}
        widget={configWidget}
        onSave={(updatedWidget) => {
          saveWidgets(
            widgets.map((w) => (w.id === updatedWidget.id ? updatedWidget : w))
          );
        }}
      />

      <LayoutSwitcher
        isOpen={showLayoutSwitcher}
        onClose={() => setShowLayoutSwitcher(false)}
        layouts={layouts}
        activeLayoutId={activeLayoutId}
        onSelectLayout={handleSelectLayout}
        onCreateLayout={handleCreateLayout}
        onEditLayout={handleEditLayout}
        onDeleteLayout={handleDeleteLayout}
        onResetToDefault={handleResetToDefault}
        currentWidgets={widgets}
      />

      {/* Unsaved changes indicator */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-amber-500 text-white text-sm font-medium shadow-lg animate-fade-in">
          You have unsaved changes
        </div>
      )}
    </div>
  );
}
