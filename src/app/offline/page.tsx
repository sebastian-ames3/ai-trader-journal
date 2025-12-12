'use client';

import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <WifiOff className="w-10 h-10 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
            <p className="text-muted-foreground">
              It looks like you&apos;ve lost your internet connection.
              Some features may be unavailable until you&apos;re back online.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-left">
            <h2 className="font-semibold mb-2">While offline, you can:</h2>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>View previously loaded entries</li>
              <li>Read cached insights</li>
              <li>Browse your dashboard</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Your changes will be synced automatically when you&apos;re back online.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
