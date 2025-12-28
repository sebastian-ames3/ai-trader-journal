'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartImportWizard from '@/components/import/smart/SmartImportWizard';

// Error boundary for catching client-side exceptions
function ErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-background rounded-xl border shadow-lg p-6 space-y-4">
        <div className="flex items-center gap-3 text-destructive">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Something went wrong</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {error.message || 'An unexpected error occurred while loading the import wizard.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}

function SmartImportContent() {
  const router = useRouter();
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client before rendering the wizard
  useEffect(() => {
    setIsClient(true);
    // Clear any potentially corrupted sessionStorage on mount
    try {
      const stored = sessionStorage.getItem('smart-import-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        // If the stored state seems corrupted, clear it
        if (!parsed || typeof parsed !== 'object' || !parsed.state) {
          sessionStorage.removeItem('smart-import-storage');
        }
      }
    } catch {
      // If parsing fails, clear the storage
      sessionStorage.removeItem('smart-import-storage');
    }
  }, []);

  const handleClose = () => {
    setIsWizardOpen(false);
    router.back();
  };

  const handleComplete = (result: { imported: number; thesesCreated: number }) => {
    console.log('[Smart Import] Complete:', result);
  };

  // Show loading state until client is ready
  if (!isClient) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header for when wizard is closed */}
      {!isWizardOpen && (
        <div className="p-4">
          <div className="max-w-lg mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="text-center space-y-4 py-12">
              <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground" />
              <h1 className="text-2xl font-bold">Smart Import</h1>
              <p className="text-muted-foreground">
                Import your trades with intelligent review and linking
              </p>
              <Button onClick={() => setIsWizardOpen(true)} size="lg">
                Start Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard Modal */}
      <SmartImportWizard
        isOpen={isWizardOpen}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </div>
  );
}

export default function SmartImportPage() {
  const [error, setError] = useState<Error | null>(null);

  // Global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();
      setError(event.error || new Error(event.message));
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const handleReset = () => {
    // Clear session storage and reset error
    try {
      sessionStorage.removeItem('smart-import-storage');
    } catch {
      // Ignore storage errors
    }
    setError(null);
    window.location.reload();
  };

  if (error) {
    return <ErrorFallback error={error} onReset={handleReset} />;
  }

  return <SmartImportContent />;
}
