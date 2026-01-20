'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  X,
  Clock,
  DollarSign,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import TradeTimeline from '@/components/TradeTimeline';
import { TradeEditModal, type TradeUpdateData } from '@/components/trades/TradeEditModal';

interface ThesisTradeAttachment {
  id: string;
  type: string;
  filename: string;
  url: string;
}

interface ThesisTrade {
  id: string;
  action: string;
  description: string;
  strategyType: string | null;
  openedAt: string;
  closedAt: string | null;
  debitCredit: number;
  quantity: number;
  realizedPL: number | null;
  status: string;
  reasoningNote: string | null;
  attachments?: ThesisTradeAttachment[];
}

interface ThesisUpdate {
  id: string;
  date: string;
  type: string;
  content: string;
}

interface Thesis {
  id: string;
  name: string;
  ticker: string;
  direction: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  status: 'ACTIVE' | 'CLOSED' | 'EXPIRED';
  originalThesis: string;
  startedAt: string;
  closedAt: string | null;
  totalRealizedPL: number;
  totalUnrealizedPL: number;
  totalCapitalDeployed: number;
  outcome: 'WIN' | 'LOSS' | 'BREAKEVEN' | null;
  lessonsLearned: string | null;
  thesisTrades: ThesisTrade[];
  updates: ThesisUpdate[];
}

const DIRECTION_CONFIG = {
  BULLISH: { icon: TrendingUp, color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  BEARISH: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  NEUTRAL: { icon: Minus, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800' },
  VOLATILE: { icon: Activity, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
};

function formatPL(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCurrency(value: number): string {
  return `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ThesisDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const thesisId = params.id as string;

  const [thesis, setThesis] = useState<Thesis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddTradeModal, setShowAddTradeModal] = useState(false);
  const [showAddUpdateModal, setShowAddUpdateModal] = useState(false);
  const [showEditTradeModal, setShowEditTradeModal] = useState(false);
  const [editingTrade, setEditingTrade] = useState<ThesisTrade | null>(null);

  // Close thesis form state
  const [closeOutcome, setCloseOutcome] = useState<'WIN' | 'LOSS' | 'BREAKEVEN'>('WIN');
  const [closeLessons, setCloseLessons] = useState('');
  const [isClosing, setIsClosing] = useState(false);

  // Add trade form state
  const [tradeAction, setTradeAction] = useState<string>('INITIAL');
  const [tradeDescription, setTradeDescription] = useState('');
  const [tradeDebitCredit, setTradeDebitCredit] = useState('');
  const [isAddingTrade, setIsAddingTrade] = useState(false);

  // Add update form state
  const [updateType, setUpdateType] = useState<string>('NOTE');
  const [updateContent, setUpdateContent] = useState('');
  const [isAddingUpdate, setIsAddingUpdate] = useState(false);

  const fetchThesis = useCallback(async () => {
    try {
      const response = await fetch(`/api/theses/${thesisId}`);
      if (!response.ok) {
        if (response.status === 404) {
          router.push('/theses');
          return;
        }
        throw new Error('Failed to fetch thesis');
      }
      const data = await response.json();
      setThesis(data);
    } catch (error) {
      console.error('Error fetching thesis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load thesis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [thesisId, router, toast]);

  useEffect(() => {
    fetchThesis();
  }, [fetchThesis]);

  const handleCloseThesis = async () => {
    if (!thesis || isClosing) return;
    setIsClosing(true);
    try {
      const response = await fetch(`/api/theses/${thesisId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome: closeOutcome,
          lessonsLearned: closeLessons.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to close thesis');
      }

      const updatedThesis = await response.json();
      setThesis(updatedThesis);
      setShowCloseModal(false);
      toast({
        title: 'Thesis closed',
        description: `${thesis.name} has been closed with outcome: ${closeOutcome}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to close thesis',
        variant: 'destructive',
      });
    } finally {
      setIsClosing(false);
    }
  };

  const handleAddTrade = async () => {
    if (!thesis || isAddingTrade || !tradeDescription.trim() || !tradeDebitCredit) return;
    setIsAddingTrade(true);
    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thesisId,
          action: tradeAction,
          description: tradeDescription.trim(),
          debitCredit: parseFloat(tradeDebitCredit),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add trade');
      }

      await fetchThesis();
      setShowAddTradeModal(false);
      setTradeAction('INITIAL');
      setTradeDescription('');
      setTradeDebitCredit('');
      toast({
        title: 'Trade logged',
        description: 'Your trade has been added to the thesis',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add trade',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTrade(false);
    }
  };

  const handleAddUpdate = async () => {
    if (!thesis || isAddingUpdate || !updateContent.trim()) return;
    setIsAddingUpdate(true);
    try {
      const response = await fetch(`/api/theses/${thesisId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: updateType,
          content: updateContent.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add update');
      }

      await fetchThesis();
      setShowAddUpdateModal(false);
      setUpdateType('NOTE');
      setUpdateContent('');
      toast({
        title: 'Update added',
        description: 'Your thesis update has been recorded',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add update',
        variant: 'destructive',
      });
    } finally {
      setIsAddingUpdate(false);
    }
  };

  const handleDeleteThesis = async () => {
    if (!thesis || !confirm('Are you sure you want to delete this thesis? This cannot be undone.')) return;
    try {
      const response = await fetch(`/api/theses/${thesisId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete thesis');
      }

      toast({
        title: 'Thesis deleted',
        description: `${thesis.name} has been deleted`,
      });
      router.push('/theses');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete thesis',
        variant: 'destructive',
      });
    }
  };

  const handleEditTrade = (trade: ThesisTrade) => {
    setEditingTrade(trade);
    setShowEditTradeModal(true);
  };

  const handleSaveTrade = async (tradeId: string, updates: TradeUpdateData) => {
    const response = await fetch(`/api/trades/${tradeId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update trade');
    }

    await fetchThesis();
    toast({
      title: 'Trade updated',
      description: 'Your trade has been updated successfully',
    });
  };

  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to delete this trade? This cannot be undone.')) return;

    try {
      const response = await fetch(`/api/trades/${tradeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete trade');
      }

      await fetchThesis();
      toast({
        title: 'Trade deleted',
        description: 'The trade has been removed from this thesis',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete trade',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="h-8 w-48 skeleton rounded" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-48 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!thesis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-slate-500">Thesis not found</p>
      </div>
    );
  }

  const DirectionIcon = DIRECTION_CONFIG[thesis.direction].icon;
  const directionColors = DIRECTION_CONFIG[thesis.direction];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/theses')}
                className="p-2 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    ${thesis.ticker}
                  </Badge>
                  <Badge className={cn('text-xs', directionColors.bgColor, directionColors.color)}>
                    <DirectionIcon className="h-3 w-3 mr-1" />
                    {thesis.direction}
                  </Badge>
                  {thesis.status === 'CLOSED' && (
                    <Badge variant="outline" className="text-xs">
                      Closed
                    </Badge>
                  )}
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {thesis.name}
                </h1>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px]" aria-label="Thesis options">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/theses/${thesisId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Thesis
                </DropdownMenuItem>
                {thesis.status === 'ACTIVE' && (
                  <DropdownMenuItem onClick={() => setShowCloseModal(true)}>
                    <X className="h-4 w-4 mr-2" />
                    Close Thesis
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleDeleteThesis}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* P/L Summary Card */}
        <div className={cn(
          'rounded-2xl p-4',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Realized P/L</p>
              <p className={cn(
                'text-xl font-bold',
                thesis.totalRealizedPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {formatPL(thesis.totalRealizedPL)}
              </p>
            </div>
            <div className="text-center border-x border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Capital Deployed</p>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(thesis.totalCapitalDeployed)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">ROC</p>
              <p className={cn(
                'text-xl font-bold',
                thesis.totalCapitalDeployed > 0
                  ? (thesis.totalRealizedPL / thesis.totalCapitalDeployed) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                  : 'text-slate-400'
              )}>
                {thesis.totalCapitalDeployed > 0
                  ? `${((thesis.totalRealizedPL / thesis.totalCapitalDeployed) * 100).toFixed(1)}%`
                  : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Original Thesis */}
        <div className={cn(
          'rounded-2xl p-4',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">
              Original Thesis
            </h2>
          </div>
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {thesis.originalThesis}
          </p>
          <p className="text-xs text-slate-400 mt-3">
            Started {format(new Date(thesis.startedAt), 'PPP')}
          </p>
        </div>

        {/* Trades Section */}
        <div className={cn(
          'rounded-2xl p-4',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Trades ({thesis.thesisTrades.length})
              </h2>
            </div>
            {thesis.status === 'ACTIVE' && (
              <Button
                size="sm"
                onClick={() => router.push(`/theses/${thesisId}/log-trade`)}
                className="min-h-[36px]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Log Trade
              </Button>
            )}
          </div>

          <TradeTimeline
            trades={thesis.thesisTrades}
            onEditTrade={handleEditTrade}
            onDeleteTrade={handleDeleteTrade}
          />
        </div>

        {/* Updates Section */}
        <div className={cn(
          'rounded-2xl p-4',
          'bg-white dark:bg-slate-800/50',
          'border border-slate-200/50 dark:border-slate-700/50'
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase">
                Updates ({thesis.updates.length})
              </h2>
            </div>
            {thesis.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddUpdateModal(true)}
                className="min-h-[36px]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            )}
          </div>

          {thesis.updates.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-4">
              No updates yet
            </p>
          ) : (
            <div className="space-y-3">
              {thesis.updates.map((update) => (
                <div
                  key={update.id}
                  className={cn(
                    'p-3 rounded-xl',
                    'bg-slate-50 dark:bg-slate-800',
                    'border-l-4',
                    update.type === 'THESIS_STRENGTHENED' && 'border-l-green-500',
                    update.type === 'THESIS_WEAKENED' && 'border-l-red-500',
                    update.type === 'THESIS_CHANGED' && 'border-l-amber-500',
                    update.type === 'NOTE' && 'border-l-slate-400'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">
                      {update.type.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {formatDistanceToNow(new Date(update.date), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {update.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lessons Learned (if closed) */}
        {thesis.status === 'CLOSED' && thesis.lessonsLearned && (
          <div className={cn(
            'rounded-2xl p-4',
            'bg-amber-50 dark:bg-amber-900/20',
            'border border-amber-200 dark:border-amber-800'
          )}>
            <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
              Lessons Learned
            </h2>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {thesis.lessonsLearned}
            </p>
          </div>
        )}
      </div>

      {/* Close Thesis Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Close Thesis</h2>
            <div className="space-y-4">
              <div>
                <Label>Outcome</Label>
                <Select value={closeOutcome} onValueChange={(v) => setCloseOutcome(v as typeof closeOutcome)}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIN">Win</SelectItem>
                    <SelectItem value="LOSS">Loss</SelectItem>
                    <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lessons Learned</Label>
                <Textarea
                  value={closeLessons}
                  onChange={(e) => setCloseLessons(e.target.value)}
                  placeholder="What did you learn from this thesis?"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setShowCloseModal(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 min-h-[44px]" onClick={handleCloseThesis} disabled={isClosing}>
                  {isClosing ? 'Closing...' : 'Close Thesis'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Trade Modal */}
      {showAddTradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Log Trade</h2>
            <div className="space-y-4">
              <div>
                <Label>Action</Label>
                <Select value={tradeAction} onValueChange={setTradeAction}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INITIAL">Initial Position</SelectItem>
                    <SelectItem value="ADD">Add to Position</SelectItem>
                    <SelectItem value="REDUCE">Reduce Position</SelectItem>
                    <SelectItem value="ROLL">Roll Position</SelectItem>
                    <SelectItem value="CLOSE">Close Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={tradeDescription}
                  onChange={(e) => setTradeDescription(e.target.value)}
                  placeholder="Describe the trade..."
                  className="min-h-[80px]"
                />
              </div>
              <div>
                <Label>Debit/Credit</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={tradeDebitCredit}
                  onChange={(e) => setTradeDebitCredit(e.target.value)}
                  placeholder="Negative for debit, positive for credit"
                  className="min-h-[44px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use negative for money spent, positive for money received
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setShowAddTradeModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 min-h-[44px]"
                  onClick={handleAddTrade}
                  disabled={isAddingTrade || !tradeDescription.trim() || !tradeDebitCredit}
                >
                  {isAddingTrade ? 'Adding...' : 'Add Trade'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Update Modal */}
      {showAddUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Thesis Update</h2>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={updateType} onValueChange={setUpdateType}>
                  <SelectTrigger className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOTE">Note</SelectItem>
                    <SelectItem value="THESIS_STRENGTHENED">Thesis Strengthened</SelectItem>
                    <SelectItem value="THESIS_WEAKENED">Thesis Weakened</SelectItem>
                    <SelectItem value="THESIS_CHANGED">Thesis Changed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  placeholder="What's the update?"
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setShowAddUpdateModal(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 min-h-[44px]"
                  onClick={handleAddUpdate}
                  disabled={isAddingUpdate || !updateContent.trim()}
                >
                  {isAddingUpdate ? 'Adding...' : 'Add Update'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trade Modal */}
      <TradeEditModal
        trade={editingTrade}
        isOpen={showEditTradeModal}
        onClose={() => {
          setShowEditTradeModal(false);
          setEditingTrade(null);
        }}
        onSave={handleSaveTrade}
      />
    </div>
  );
}
