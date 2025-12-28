'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileSpreadsheet, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartImportWizard from '@/components/import/smart/SmartImportWizard';
import { useSmartImportStore } from '@/stores/smartImportStore';

export default function SmartImportPage() {
  const router = useRouter();
  const [isWizardOpen, setIsWizardOpen] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure client-side only rendering and reset store on mount
  useEffect(() => {
    useSmartImportStore.getState().reset();
    setIsMounted(true);
  }, []);

  const handleClose = () => {
    setIsWizardOpen(false);
    router.back();
  };

  const handleComplete = (result: { imported: number; thesesCreated: number }) => {
    console.log('[Smart Import] Complete:', result);
  };

  // Show loading until client is mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
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

      <SmartImportWizard
        isOpen={isWizardOpen}
        onClose={handleClose}
        onComplete={handleComplete}
      />
    </div>
  );
}
