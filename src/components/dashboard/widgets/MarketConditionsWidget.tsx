'use client';

import * as React from 'react';
import { Activity, TrendingUp, TrendingDown, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface MarketConditionsWidgetProps {
  spy?: MarketData;
  vix?: MarketData;
  marketStatus?: 'open' | 'closed' | 'pre-market' | 'after-hours';
  alerts?: string[];
  lastUpdated?: Date | string;
  onRefresh?: () => void;
  className?: string;
}

const MARKET_STATUS_CONFIG = {
  open: {
    label: 'Market Open',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  closed: {
    label: 'Market Closed',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  },
  'pre-market': {
    label: 'Pre-Market',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  'after-hours': {
    label: 'After Hours',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

export function MarketConditionsWidget({
  spy,
  vix,
  marketStatus = 'closed',
  alerts = [],
  lastUpdated,
  onRefresh,
  className,
}: MarketConditionsWidgetProps) {
  const statusConfig = MARKET_STATUS_CONFIG[marketStatus];

  const formatTime = (date?: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  const getVixLevel = (price?: number) => {
    if (!price) return null;
    if (price < 15) return { level: 'Low', color: 'text-green-600 dark:text-green-400' };
    if (price < 20) return { level: 'Normal', color: 'text-slate-600 dark:text-slate-400' };
    if (price < 30) return { level: 'Elevated', color: 'text-amber-600 dark:text-amber-400' };
    return { level: 'High', color: 'text-red-600 dark:text-red-400' };
  };

  const vixLevel = getVixLevel(vix?.price);

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            Market
          </h3>
        </div>
        <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Market Data */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* SPY */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">SPY</span>
            {spy && spy.change !== 0 && (
              spy.change > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              )
            )}
          </div>
          {spy ? (
            <>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                ${spy.price.toFixed(2)}
              </p>
              <p className={cn('text-xs', getChangeColor(spy.change))}>
                {spy.change >= 0 ? '+' : ''}{spy.change.toFixed(2)} ({spy.changePercent.toFixed(2)}%)
              </p>
            </>
          ) : (
            <p className="text-lg text-slate-400">--</p>
          )}
        </div>

        {/* VIX */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-slate-500">VIX</span>
            {vixLevel && (
              <span className={cn('text-xs', vixLevel.color)}>
                {vixLevel.level}
              </span>
            )}
          </div>
          {vix ? (
            <>
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {vix.price.toFixed(2)}
              </p>
              <p className={cn('text-xs', getChangeColor(vix.change))}>
                {vix.change >= 0 ? '+' : ''}{vix.change.toFixed(2)} ({vix.changePercent.toFixed(2)}%)
              </p>
            </>
          ) : (
            <p className="text-lg text-slate-400">--</p>
          )}
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex-1 space-y-2">
          {alerts.slice(0, 2).map((alert, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {alert}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto pt-2 flex items-center justify-between">
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Updated {formatTime(lastUpdated)}
          </span>
        )}
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 px-2"
            aria-label="Refresh market data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Sample data for demo/testing
export const SAMPLE_MARKET_DATA = {
  spy: {
    symbol: 'SPY',
    name: 'S&P 500 ETF',
    price: 595.42,
    change: 4.23,
    changePercent: 0.72,
  },
  vix: {
    symbol: 'VIX',
    name: 'Volatility Index',
    price: 18.32,
    change: -1.05,
    changePercent: -5.42,
  },
  alerts: [
    'VIX below average - low volatility environment',
    'SPY approaching all-time highs',
  ],
};

// Skeleton for loading
export function MarketConditionsWidgetSkeleton() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 skeleton rounded" />
        <div className="h-5 w-24 skeleton rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="h-3 w-8 skeleton rounded mb-2" />
            <div className="h-6 w-16 skeleton rounded mb-1" />
            <div className="h-3 w-20 skeleton rounded" />
          </div>
        ))}
      </div>
      <div className="flex-1">
        <div className="h-12 w-full skeleton rounded-lg" />
      </div>
    </div>
  );
}
