'use client';

import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useToast } from '@/hooks/use-toast';
import { ManualIvPayload, ManualIvResponse } from '@/lib/types/iv';
import { parseIvInput, validateIvPct } from '@/lib/iv';
import { logger } from '@/lib/logger';

interface ManualIvFormProps {
  selectedTicker: string;
  onIvSaved?: (data: ManualIvResponse['data']) => void;
}

export default function ManualIvForm({ selectedTicker, onIvSaved }: ManualIvFormProps) {
  const { toast } = useToast();
  const [ivInput, setIvInput] = useState('');
  const [termDays, setTermDays] = useState('30');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Parse and validate IV
    const ivPct = parseIvInput(ivInput);
    if (ivPct === null) {
      setError('Please enter a valid number');
      return;
    }
    
    const validation = validateIvPct(ivPct);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }
    
    setLoading(true);
    
    try {
      const payload: ManualIvPayload = {
        ticker: selectedTicker,
        ivPct,
        ivTermDays: parseInt(termDays)
      };
      
      logger.debug('Submitting IV', payload);
      
      const response = await fetch('/api/iv/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data: ManualIvResponse = await response.json();
      
      if (data.success) {
        toast({
          title: 'IV saved',
          description: `IV ${data.data!.iv}% saved for ${data.data!.ticker}`,
        });
        
        setIvInput('');
        onIvSaved?.(data.data);
        
      } else {
        setError(data.error?.message || 'Failed to save IV');
      }
      
    } catch (err) {
      logger.error('IV submit error', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const isValid = ivInput.trim().length > 0 && !error;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="iv-input">Implied Volatility (IV)</Label>
        <div className="flex gap-2 items-center">
          <Input
            id="iv-input"
            type="text"
            inputMode="decimal"
            placeholder="28.5"
            value={ivInput}
            onChange={(e) => {
              setIvInput(e.target.value);
              setError(null);
            }}
            className={error ? 'border-red-500' : ''}
            disabled={loading}
            aria-invalid={!!error}
            aria-describedby={error ? 'iv-error' : undefined}
          />
          <span className="text-muted-foreground">%</span>
        </div>
        {error && (
          <p id="iv-error" className="text-sm text-red-500" role="alert" aria-live="polite">
            {error}
          </p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="term-select">Term</Label>
        <Select value={termDays} onValueChange={setTermDays} disabled={loading}>
          <SelectTrigger id="term-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 day</SelectItem>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="60">60 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <Button type="submit" disabled={!isValid || loading} className="w-full">
        {loading ? 'Saving...' : 'Save IV'}
      </Button>
    </form>
  );
}