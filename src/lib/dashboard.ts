/**
 * Dashboard Service Library
 *
 * Provides widget type definitions, registry, default layouts,
 * widget size mappings, and layout template definitions for
 * the custom dashboard feature.
 */

import { WidgetSize, WidgetCategory } from '@prisma/client';

// Widget type constants
export const WIDGET_TYPES = {
  QUICK_CAPTURE: 'QUICK_CAPTURE',
  STREAK: 'STREAK',
  WEEKLY_INSIGHTS: 'WEEKLY_INSIGHTS',
  RECENT_ENTRIES: 'RECENT_ENTRIES',
  MOOD_TREND: 'MOOD_TREND',
  BIAS_TRACKER: 'BIAS_TRACKER',
  CONVICTION_ANALYSIS: 'CONVICTION_ANALYSIS',
  OPEN_POSITIONS: 'OPEN_POSITIONS',
  COACH_PROMPT: 'COACH_PROMPT',
  GOALS_PROGRESS: 'GOALS_PROGRESS',
  ACCOUNTABILITY: 'ACCOUNTABILITY',
  MARKET_CONDITIONS: 'MARKET_CONDITIONS',
  TAG_CLOUD: 'TAG_CLOUD',
  CALENDAR_HEATMAP: 'CALENDAR_HEATMAP',
} as const;

export type WidgetType = keyof typeof WIDGET_TYPES;

// Widget size options per type
export interface WidgetSizeOption {
  size: WidgetSize;
  gridCols: { mobile: number; tablet: number; desktop: number };
  gridRows: { mobile: number; tablet: number; desktop: number };
}

// Widget definition interface
export interface WidgetDefinition {
  type: WidgetType;
  name: string;
  description: string;
  category: WidgetCategory;
  sizes: WidgetSizeOption[];
  defaultSize: WidgetSize;
  configSchema: WidgetConfigSchema;
  dataEndpoint?: string;
}

// Configuration schema for widget settings
export interface WidgetConfigSchema {
  properties: Record<string, ConfigProperty>;
  required?: string[];
}

export interface ConfigProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
}

// Widget instance for layouts
export interface WidgetInstance {
  widgetId: string;
  widgetType: WidgetType;
  config: Record<string, unknown>;
  position: {
    mobile: { x: number; y: number; w: number; h: number };
    tablet: { x: number; y: number; w: number; h: number };
    desktop: { x: number; y: number; w: number; h: number };
  };
}

// Widget size mappings
export const WIDGET_SIZE_MAPPINGS: Record<WidgetSize, { cols: number; rows: number }> = {
  SMALL: { cols: 1, rows: 1 },
  MEDIUM: { cols: 2, rows: 1 },
  LARGE: { cols: 2, rows: 2 },
  FULL: { cols: 4, rows: 1 },
};

// Widget Registry
export const WIDGET_REGISTRY: Record<WidgetType, WidgetDefinition> = {
  QUICK_CAPTURE: {
    type: 'QUICK_CAPTURE',
    name: 'Quick Capture',
    description: 'Quickly capture thoughts, ideas, and observations',
    category: 'CAPTURE',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 2, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        defaultEntryType: {
          type: 'string',
          title: 'Default Entry Type',
          description: 'Pre-selected entry type for quick capture',
          enum: ['IDEA', 'DECISION', 'REFLECTION', 'OBSERVATION'],
          default: 'OBSERVATION',
        },
        showVoiceCapture: {
          type: 'boolean',
          title: 'Show Voice Capture',
          description: 'Display voice recording option',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/entries',
  },
  STREAK: {
    type: 'STREAK',
    name: 'Journaling Streak',
    description: 'Track your journaling consistency and milestones',
    category: 'TRACKING',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        showLongestStreak: {
          type: 'boolean',
          title: 'Show Longest Streak',
          description: 'Display all-time longest streak',
          default: true,
        },
        showTotalEntries: {
          type: 'boolean',
          title: 'Show Total Entries',
          description: 'Display total entry count',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/streak',
  },
  WEEKLY_INSIGHTS: {
    type: 'WEEKLY_INSIGHTS',
    name: 'Weekly Insights',
    description: 'AI-generated insights from your weekly journaling',
    category: 'INSIGHTS',
    sizes: [
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 1, desktop: 1 } },
      { size: 'LARGE', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 2, desktop: 2 } },
    ],
    defaultSize: 'LARGE',
    configSchema: {
      properties: {
        weekOffset: {
          type: 'number',
          title: 'Week Offset',
          description: 'Which week to display (0 = current, -1 = last week)',
          default: 0,
          minimum: -52,
          maximum: 0,
        },
        showComparison: {
          type: 'boolean',
          title: 'Show Week Comparison',
          description: 'Display week-over-week comparison',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/insights/weekly',
  },
  RECENT_ENTRIES: {
    type: 'RECENT_ENTRIES',
    name: 'Recent Entries',
    description: 'View your most recent journal entries',
    category: 'TRACKING',
    sizes: [
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 1, desktop: 1 } },
      { size: 'LARGE', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 2, desktop: 2 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        limit: {
          type: 'number',
          title: 'Entry Count',
          description: 'Number of entries to display',
          default: 5,
          minimum: 1,
          maximum: 20,
        },
        filterType: {
          type: 'string',
          title: 'Filter by Type',
          description: 'Only show specific entry types',
          enum: ['ALL', 'IDEA', 'DECISION', 'REFLECTION', 'OBSERVATION'],
          default: 'ALL',
        },
      },
    },
    dataEndpoint: '/api/entries',
  },
  MOOD_TREND: {
    type: 'MOOD_TREND',
    name: 'Mood Trend',
    description: 'Track your emotional patterns over time',
    category: 'INSIGHTS',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        timeRange: {
          type: 'string',
          title: 'Time Range',
          description: 'Period for mood analysis',
          enum: ['7d', '14d', '30d', '90d'],
          default: '7d',
        },
        showSentiment: {
          type: 'boolean',
          title: 'Show Sentiment',
          description: 'Include AI sentiment analysis',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/insights/weekly',
  },
  BIAS_TRACKER: {
    type: 'BIAS_TRACKER',
    name: 'Bias Tracker',
    description: 'Monitor detected cognitive biases in your entries',
    category: 'INSIGHTS',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        timeRange: {
          type: 'string',
          title: 'Time Range',
          description: 'Period for bias analysis',
          enum: ['7d', '14d', '30d', '90d'],
          default: '30d',
        },
        topBiasCount: {
          type: 'number',
          title: 'Top Biases to Show',
          description: 'Number of top biases to display',
          default: 5,
          minimum: 3,
          maximum: 10,
        },
      },
    },
    dataEndpoint: '/api/patterns',
  },
  CONVICTION_ANALYSIS: {
    type: 'CONVICTION_ANALYSIS',
    name: 'Conviction Analysis',
    description: 'Analyze your conviction levels and their outcomes',
    category: 'INSIGHTS',
    sizes: [
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        showDistribution: {
          type: 'boolean',
          title: 'Show Distribution',
          description: 'Display conviction level breakdown',
          default: true,
        },
        showCorrelation: {
          type: 'boolean',
          title: 'Show Outcome Correlation',
          description: 'Show correlation with trade outcomes',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/insights/weekly',
  },
  OPEN_POSITIONS: {
    type: 'OPEN_POSITIONS',
    name: 'Open Positions',
    description: 'Track your active trading theses and positions',
    category: 'POSITIONS',
    sizes: [
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 1, desktop: 1 } },
      { size: 'LARGE', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 2, tablet: 2, desktop: 2 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        sortBy: {
          type: 'string',
          title: 'Sort By',
          description: 'How to sort positions',
          enum: ['recent', 'pnl', 'ticker'],
          default: 'recent',
        },
        showPnL: {
          type: 'boolean',
          title: 'Show P/L',
          description: 'Display profit/loss information',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/theses',
  },
  COACH_PROMPT: {
    type: 'COACH_PROMPT',
    name: 'Coach Prompt',
    description: 'AI coaching prompts based on your trading patterns',
    category: 'INSIGHTS',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 2, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        promptType: {
          type: 'string',
          title: 'Prompt Type',
          description: 'Type of coaching prompts to show',
          enum: ['all', 'emotional', 'strategy', 'bias'],
          default: 'all',
        },
      },
    },
    dataEndpoint: '/api/coach/prompts',
  },
  GOALS_PROGRESS: {
    type: 'GOALS_PROGRESS',
    name: 'Goals Progress',
    description: 'Track progress on your trading goals',
    category: 'TRACKING',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        showCompleted: {
          type: 'boolean',
          title: 'Show Completed Goals',
          description: 'Include recently completed goals',
          default: false,
        },
        limit: {
          type: 'number',
          title: 'Goal Count',
          description: 'Number of goals to display',
          default: 3,
          minimum: 1,
          maximum: 10,
        },
      },
    },
    dataEndpoint: '/api/coach/goals',
  },
  ACCOUNTABILITY: {
    type: 'ACCOUNTABILITY',
    name: 'Accountability',
    description: 'View accountability partner activity',
    category: 'SOCIAL',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        showPartnerStreak: {
          type: 'boolean',
          title: 'Show Partner Streak',
          description: 'Display partner journaling streak',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/accountability',
  },
  MARKET_CONDITIONS: {
    type: 'MARKET_CONDITIONS',
    name: 'Market Conditions',
    description: 'Current market state and volatility indicators',
    category: 'POSITIONS',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        showVix: {
          type: 'boolean',
          title: 'Show VIX',
          description: 'Display VIX level',
          default: true,
        },
        showSpyChange: {
          type: 'boolean',
          title: 'Show SPY Change',
          description: 'Display SPY daily change',
          default: true,
        },
      },
    },
    dataEndpoint: '/api/market-condition',
  },
  TAG_CLOUD: {
    type: 'TAG_CLOUD',
    name: 'Tag Cloud',
    description: 'Visual display of your most used tags',
    category: 'INSIGHTS',
    sizes: [
      { size: 'SMALL', gridCols: { mobile: 1, tablet: 1, desktop: 1 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'SMALL',
    configSchema: {
      properties: {
        timeRange: {
          type: 'string',
          title: 'Time Range',
          description: 'Period for tag analysis',
          enum: ['7d', '30d', '90d', 'all'],
          default: '30d',
        },
        maxTags: {
          type: 'number',
          title: 'Maximum Tags',
          description: 'Maximum tags to display',
          default: 15,
          minimum: 5,
          maximum: 30,
        },
      },
    },
    dataEndpoint: '/api/entries',
  },
  CALENDAR_HEATMAP: {
    type: 'CALENDAR_HEATMAP',
    name: 'Calendar Heatmap',
    description: 'Visualize journaling activity over time',
    category: 'TRACKING',
    sizes: [
      { size: 'MEDIUM', gridCols: { mobile: 2, tablet: 2, desktop: 2 }, gridRows: { mobile: 1, tablet: 1, desktop: 1 } },
    ],
    defaultSize: 'MEDIUM',
    configSchema: {
      properties: {
        months: {
          type: 'number',
          title: 'Months to Display',
          description: 'Number of months to show',
          default: 3,
          minimum: 1,
          maximum: 12,
        },
        colorMetric: {
          type: 'string',
          title: 'Color Metric',
          description: 'What determines color intensity',
          enum: ['entries', 'sentiment'],
          default: 'entries',
        },
      },
    },
    dataEndpoint: '/api/entries',
  },
};

// Layout template definitions
export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'beginner' | 'advanced' | 'minimal' | 'options-trader' | 'psychology';
  widgets: WidgetInstance[];
  thumbnail?: string;
}

// Helper to generate widget ID
export function generateWidgetId(): string {
  return `widget_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Default layout configuration
export const DEFAULT_LAYOUT: WidgetInstance[] = [
  // Top row: Quick capture, streak, coach prompt
  {
    widgetId: generateWidgetId(),
    widgetType: 'QUICK_CAPTURE',
    config: { defaultEntryType: 'OBSERVATION', showVoiceCapture: true },
    position: {
      mobile: { x: 0, y: 0, w: 2, h: 1 },
      tablet: { x: 0, y: 0, w: 1, h: 1 },
      desktop: { x: 0, y: 0, w: 1, h: 1 },
    },
  },
  {
    widgetId: generateWidgetId(),
    widgetType: 'STREAK',
    config: { showLongestStreak: true, showTotalEntries: true },
    position: {
      mobile: { x: 0, y: 1, w: 1, h: 1 },
      tablet: { x: 1, y: 0, w: 1, h: 1 },
      desktop: { x: 1, y: 0, w: 1, h: 1 },
    },
  },
  {
    widgetId: generateWidgetId(),
    widgetType: 'COACH_PROMPT',
    config: { promptType: 'all' },
    position: {
      mobile: { x: 1, y: 1, w: 1, h: 1 },
      tablet: { x: 2, y: 0, w: 1, h: 1 },
      desktop: { x: 2, y: 0, w: 1, h: 1 },
    },
  },
  // Second row: Weekly insights (large) + goals
  {
    widgetId: generateWidgetId(),
    widgetType: 'WEEKLY_INSIGHTS',
    config: { weekOffset: 0, showComparison: true },
    position: {
      mobile: { x: 0, y: 2, w: 2, h: 2 },
      tablet: { x: 0, y: 1, w: 2, h: 2 },
      desktop: { x: 0, y: 1, w: 2, h: 2 },
    },
  },
  {
    widgetId: generateWidgetId(),
    widgetType: 'GOALS_PROGRESS',
    config: { showCompleted: false, limit: 3 },
    position: {
      mobile: { x: 0, y: 4, w: 2, h: 1 },
      tablet: { x: 2, y: 1, w: 1, h: 1 },
      desktop: { x: 2, y: 1, w: 1, h: 1 },
    },
  },
  // Third row: Recent entries (full width)
  {
    widgetId: generateWidgetId(),
    widgetType: 'RECENT_ENTRIES',
    config: { limit: 5, filterType: 'ALL' },
    position: {
      mobile: { x: 0, y: 5, w: 2, h: 2 },
      tablet: { x: 0, y: 3, w: 4, h: 1 },
      desktop: { x: 0, y: 3, w: 4, h: 1 },
    },
  },
];

// Pre-built layout templates
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'beginner',
    name: 'Beginner',
    description: 'Simple layout for new traders focusing on consistency',
    category: 'beginner',
    widgets: [
      {
        widgetId: generateWidgetId(),
        widgetType: 'QUICK_CAPTURE',
        config: { defaultEntryType: 'OBSERVATION', showVoiceCapture: true },
        position: {
          mobile: { x: 0, y: 0, w: 2, h: 1 },
          tablet: { x: 0, y: 0, w: 2, h: 1 },
          desktop: { x: 0, y: 0, w: 2, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'STREAK',
        config: { showLongestStreak: true, showTotalEntries: true },
        position: {
          mobile: { x: 0, y: 1, w: 2, h: 1 },
          tablet: { x: 2, y: 0, w: 1, h: 1 },
          desktop: { x: 2, y: 0, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'RECENT_ENTRIES',
        config: { limit: 5, filterType: 'ALL' },
        position: {
          mobile: { x: 0, y: 2, w: 2, h: 2 },
          tablet: { x: 0, y: 1, w: 4, h: 2 },
          desktop: { x: 0, y: 1, w: 4, h: 2 },
        },
      },
    ],
  },
  {
    id: 'psychology-focus',
    name: 'Psychology Focus',
    description: 'Deep dive into emotional patterns and biases',
    category: 'psychology',
    widgets: [
      {
        widgetId: generateWidgetId(),
        widgetType: 'MOOD_TREND',
        config: { timeRange: '30d', showSentiment: true },
        position: {
          mobile: { x: 0, y: 0, w: 2, h: 1 },
          tablet: { x: 0, y: 0, w: 2, h: 1 },
          desktop: { x: 0, y: 0, w: 2, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'BIAS_TRACKER',
        config: { timeRange: '30d', topBiasCount: 5 },
        position: {
          mobile: { x: 0, y: 1, w: 2, h: 1 },
          tablet: { x: 2, y: 0, w: 2, h: 1 },
          desktop: { x: 2, y: 0, w: 2, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'WEEKLY_INSIGHTS',
        config: { weekOffset: 0, showComparison: true },
        position: {
          mobile: { x: 0, y: 2, w: 2, h: 2 },
          tablet: { x: 0, y: 1, w: 2, h: 2 },
          desktop: { x: 0, y: 1, w: 2, h: 2 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'COACH_PROMPT',
        config: { promptType: 'emotional' },
        position: {
          mobile: { x: 0, y: 4, w: 2, h: 1 },
          tablet: { x: 2, y: 1, w: 1, h: 1 },
          desktop: { x: 2, y: 1, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'CONVICTION_ANALYSIS',
        config: { showDistribution: true, showCorrelation: true },
        position: {
          mobile: { x: 0, y: 5, w: 2, h: 1 },
          tablet: { x: 2, y: 2, w: 2, h: 1 },
          desktop: { x: 2, y: 2, w: 2, h: 1 },
        },
      },
    ],
  },
  {
    id: 'options-trader',
    name: 'Options Trader',
    description: 'Focus on positions, market conditions, and thesis tracking',
    category: 'options-trader',
    widgets: [
      {
        widgetId: generateWidgetId(),
        widgetType: 'MARKET_CONDITIONS',
        config: { showVix: true, showSpyChange: true },
        position: {
          mobile: { x: 0, y: 0, w: 1, h: 1 },
          tablet: { x: 0, y: 0, w: 1, h: 1 },
          desktop: { x: 0, y: 0, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'QUICK_CAPTURE',
        config: { defaultEntryType: 'IDEA', showVoiceCapture: true },
        position: {
          mobile: { x: 1, y: 0, w: 1, h: 1 },
          tablet: { x: 1, y: 0, w: 1, h: 1 },
          desktop: { x: 1, y: 0, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'OPEN_POSITIONS',
        config: { sortBy: 'recent', showPnL: true },
        position: {
          mobile: { x: 0, y: 1, w: 2, h: 2 },
          tablet: { x: 0, y: 1, w: 2, h: 2 },
          desktop: { x: 0, y: 1, w: 2, h: 2 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'STREAK',
        config: { showLongestStreak: true, showTotalEntries: false },
        position: {
          mobile: { x: 0, y: 3, w: 1, h: 1 },
          tablet: { x: 2, y: 0, w: 1, h: 1 },
          desktop: { x: 2, y: 0, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'BIAS_TRACKER',
        config: { timeRange: '7d', topBiasCount: 3 },
        position: {
          mobile: { x: 1, y: 3, w: 1, h: 1 },
          tablet: { x: 2, y: 1, w: 2, h: 1 },
          desktop: { x: 2, y: 1, w: 2, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'RECENT_ENTRIES',
        config: { limit: 3, filterType: 'DECISION' },
        position: {
          mobile: { x: 0, y: 4, w: 2, h: 2 },
          tablet: { x: 0, y: 3, w: 4, h: 1 },
          desktop: { x: 0, y: 3, w: 4, h: 1 },
        },
      },
    ],
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free layout with essential widgets only',
    category: 'minimal',
    widgets: [
      {
        widgetId: generateWidgetId(),
        widgetType: 'QUICK_CAPTURE',
        config: { defaultEntryType: 'OBSERVATION', showVoiceCapture: false },
        position: {
          mobile: { x: 0, y: 0, w: 2, h: 1 },
          tablet: { x: 0, y: 0, w: 2, h: 1 },
          desktop: { x: 0, y: 0, w: 2, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'STREAK',
        config: { showLongestStreak: false, showTotalEntries: false },
        position: {
          mobile: { x: 0, y: 1, w: 1, h: 1 },
          tablet: { x: 2, y: 0, w: 1, h: 1 },
          desktop: { x: 2, y: 0, w: 1, h: 1 },
        },
      },
      {
        widgetId: generateWidgetId(),
        widgetType: 'RECENT_ENTRIES',
        config: { limit: 3, filterType: 'ALL' },
        position: {
          mobile: { x: 0, y: 2, w: 2, h: 2 },
          tablet: { x: 0, y: 1, w: 3, h: 2 },
          desktop: { x: 0, y: 1, w: 3, h: 2 },
        },
      },
    ],
  },
  {
    id: 'advanced',
    name: 'Advanced',
    description: 'Comprehensive layout with all key metrics and insights',
    category: 'advanced',
    widgets: DEFAULT_LAYOUT.map(w => ({ ...w, widgetId: generateWidgetId() })),
  },
];

// Validation helpers
export function isValidWidgetType(type: string): type is WidgetType {
  return type in WIDGET_TYPES;
}

export function getWidgetDefinition(type: WidgetType): WidgetDefinition | undefined {
  return WIDGET_REGISTRY[type];
}

export function validateWidgetConfig(type: WidgetType, config: Record<string, unknown>): boolean {
  const definition = getWidgetDefinition(type);
  if (!definition) return false;

  const schema = definition.configSchema;

  // Validate required properties
  if (schema.required) {
    for (const prop of schema.required) {
      if (!(prop in config)) return false;
    }
  }

  // Validate property types and constraints
  for (const [key, value] of Object.entries(config)) {
    const propSchema = schema.properties[key];
    if (!propSchema) continue;

    // Type validation
    if (propSchema.type === 'string' && typeof value !== 'string') return false;
    if (propSchema.type === 'number' && typeof value !== 'number') return false;
    if (propSchema.type === 'boolean' && typeof value !== 'boolean') return false;
    if (propSchema.type === 'array' && !Array.isArray(value)) return false;

    // Enum validation
    if (propSchema.enum && !propSchema.enum.includes(value as string)) return false;

    // Range validation
    if (typeof value === 'number') {
      if (propSchema.minimum !== undefined && value < propSchema.minimum) return false;
      if (propSchema.maximum !== undefined && value > propSchema.maximum) return false;
    }
  }

  return true;
}

// Get default config for a widget type
export function getDefaultWidgetConfig(type: WidgetType): Record<string, unknown> {
  const definition = getWidgetDefinition(type);
  if (!definition) return {};

  const defaultConfig: Record<string, unknown> = {};

  for (const [key, prop] of Object.entries(definition.configSchema.properties)) {
    if (prop.default !== undefined) {
      defaultConfig[key] = prop.default;
    }
  }

  return defaultConfig;
}

// Get all widget types by category
export function getWidgetsByCategory(category: WidgetCategory): WidgetDefinition[] {
  return Object.values(WIDGET_REGISTRY).filter(w => w.category === category);
}

// Get all available categories
export function getWidgetCategories(): WidgetCategory[] {
  return ['CAPTURE', 'INSIGHTS', 'TRACKING', 'POSITIONS', 'SOCIAL'];
}
