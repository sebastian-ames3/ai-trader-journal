'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { fetchDailyCloses } from '@/lib/data';
import { calculateHVMetrics, HVResult } from '@/lib/hv';
import { logger } from '@/lib/logger';

interface HvCardProps {
  ticker: string;
}

export function HvCard({ ticker }: HvCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hvData, setHvData] = useState<HVResult | null>(null);

  useEffect(() => {
    async function loadHV() {
      if (!ticker) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Fetch 35 days to ensure we have enough for HV30
        const response = await fetchDailyCloses(ticker.toUpperCase(), 35);
        
        if (!response.success || !response.data) {
          setError(response.error || 'Failed to load data');
          return;
        }

        const metrics = calculateHVMetrics(response.data.closes);
        setHvData(metrics);
        
        logger.debug('HvCard data loaded', { ticker, metrics });
      } catch (err) {
        logger.error('HvCard error', err);
        setError('Failed to calculate HV');
      } finally {
        setLoading(false);
      }
    }

    loadHV();
  }, [ticker]);

  if (!ticker) return null;

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Historical Volatility
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="text-sm text-muted-foreground">
            Loading HV data...
          </div>
        )}
        
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
        
        {!loading && !error && hvData && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">HV20</div>
                <div className="text-lg font-semibold">
                  {hvData.hv20 !== null 
                    ? `${hvData.hv20.toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">HV30</div>
                <div className="text-lg font-semibold">
                  {hvData.hv30 !== null 
                    ? `${hvData.hv30.toFixed(1)}%`
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              {hvData.dataPoints < 20 && (
                <div className="text-amber-600 dark:text-amber-500">
                  Insufficient data ({hvData.dataPoints} days available)
                </div>
              )}
              {hvData.dataPoints >= 20 && (
                <div>
                  Calculated: {new Date(hvData.calculatedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}