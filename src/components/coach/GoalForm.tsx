'use client';

import * as React from 'react';
import { useState } from 'react';
import { Target, Flame, Trophy, CheckCircle, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Goal types
type GoalType =
  | 'JOURNALING_STREAK'
  | 'ENTRIES_PER_WEEK'
  | 'PRE_TRADE_CHECKS'
  | 'BIAS_REDUCTION'
  | 'WIN_RATE'
  | 'CUSTOM';

interface GoalTemplate {
  type: GoalType;
  name: string;
  description: string;
  defaultTarget: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}

interface GoalFormData {
  type: GoalType;
  name: string;
  description: string;
  targetValue: number;
  unit: string;
  endDate?: string;
}

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Pre-defined goal templates
const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    type: 'JOURNALING_STREAK',
    name: 'Journaling Streak',
    description: 'Journal every day to build a consistent reflection habit',
    defaultTarget: 7,
    unit: 'days',
    icon: Flame,
    color: 'text-orange-600 dark:text-orange-400',
  },
  {
    type: 'ENTRIES_PER_WEEK',
    name: 'Weekly Entries',
    description: 'Write a minimum number of journal entries each week',
    defaultTarget: 5,
    unit: 'entries',
    icon: Target,
    color: 'text-blue-600 dark:text-blue-400',
  },
  {
    type: 'PRE_TRADE_CHECKS',
    name: 'Pre-Trade Checks',
    description: 'Complete a pre-trade checklist before each trade',
    defaultTarget: 10,
    unit: 'checks',
    icon: CheckCircle,
    color: 'text-green-600 dark:text-green-400',
  },
  {
    type: 'BIAS_REDUCTION',
    name: 'Bias Reduction',
    description: 'Reduce detected cognitive biases in your entries',
    defaultTarget: 50,
    unit: '% reduction',
    icon: Target,
    color: 'text-purple-600 dark:text-purple-400',
  },
  {
    type: 'WIN_RATE',
    name: 'Improve Win Rate',
    description: 'Achieve a target win rate on your trades',
    defaultTarget: 60,
    unit: '% win rate',
    icon: Trophy,
    color: 'text-amber-500',
  },
];

// Template selection card
function TemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: GoalTemplate;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = template.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left',
        'p-4 rounded-xl',
        'border-2 transition-all',
        'min-h-[44px]',
        isSelected
          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl',
            'flex items-center justify-center',
            isSelected
              ? 'bg-amber-100 dark:bg-amber-900/50'
              : 'bg-slate-100 dark:bg-slate-800'
          )}
        >
          <Icon className={cn('h-5 w-5', template.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-medium text-slate-900 dark:text-slate-100">
              {template.name}
            </h4>
            {isSelected && (
              <Badge className="bg-amber-500 text-white flex-shrink-0">
                Selected
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {template.description}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Default: {template.defaultTarget} {template.unit}
          </p>
        </div>
      </div>
    </button>
  );
}

// Custom goal form fields
function CustomGoalFields({
  formData,
  onChange,
}: {
  formData: GoalFormData;
  onChange: (data: Partial<GoalFormData>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="goal-name" className="text-slate-700 dark:text-slate-300">
          Goal Name
        </Label>
        <Input
          id="goal-name"
          value={formData.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g., Trade only setups from my playbook"
          className="mt-1.5 min-h-[44px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="goal-description" className="text-slate-700 dark:text-slate-300">
          Description (optional)
        </Label>
        <Textarea
          id="goal-description"
          value={formData.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what you want to achieve..."
          className="mt-1.5 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="target-value" className="text-slate-700 dark:text-slate-300">
            Target Value
          </Label>
          <Input
            id="target-value"
            type="number"
            min="1"
            value={formData.targetValue}
            onChange={(e) => onChange({ targetValue: parseInt(e.target.value) || 0 })}
            className="mt-1.5 min-h-[44px]"
            required
          />
        </div>
        <div>
          <Label htmlFor="unit" className="text-slate-700 dark:text-slate-300">
            Unit
          </Label>
          <Input
            id="unit"
            value={formData.unit}
            onChange={(e) => onChange({ unit: e.target.value })}
            placeholder="e.g., trades, days, %"
            className="mt-1.5 min-h-[44px]"
            required
          />
        </div>
      </div>
    </div>
  );
}

export default function GoalForm({
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: GoalFormProps) {
  const [step, setStep] = useState<'template' | 'customize'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    type: 'CUSTOM',
    name: '',
    description: '',
    targetValue: 1,
    unit: 'times',
    endDate: '',
  });

  // Handle template selection
  const handleTemplateSelect = (template: GoalTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      description: template.description,
      targetValue: template.defaultTarget,
      unit: template.unit,
      endDate: '',
    });
  };

  // Handle custom goal selection
  const handleCustomSelect = () => {
    setSelectedTemplate(null);
    setFormData({
      type: 'CUSTOM',
      name: '',
      description: '',
      targetValue: 1,
      unit: 'times',
      endDate: '',
    });
  };

  // Update form data
  const handleFormChange = (updates: Partial<GoalFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.targetValue < 1) return;
    await onSubmit(formData);
  };

  // Proceed to customize step
  const handleContinue = () => {
    if (selectedTemplate || formData.type === 'CUSTOM') {
      setStep('customize');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {step === 'template' ? (
        <>
          {/* Template selection step */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Choose a Goal Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {GOAL_TEMPLATES.map((template) => (
                <TemplateCard
                  key={template.type}
                  template={template}
                  isSelected={selectedTemplate?.type === template.type}
                  onClick={() => handleTemplateSelect(template)}
                />
              ))}

              {/* Custom goal option */}
              <button
                type="button"
                onClick={handleCustomSelect}
                className={cn(
                  'w-full text-left',
                  'p-4 rounded-xl',
                  'border-2 border-dashed transition-all',
                  'min-h-[44px]',
                  formData.type === 'CUSTOM' && !selectedTemplate
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30'
                    : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-800/30'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-xl',
                      'flex items-center justify-center',
                      'bg-slate-100 dark:bg-slate-800'
                    )}
                  >
                    <Target className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      Custom Goal
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Create your own personalized goal
                    </p>
                  </div>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Continue button */}
          <div className="flex gap-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 min-h-[48px]"
              >
                Cancel
              </Button>
            )}
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!selectedTemplate && formData.type !== 'CUSTOM'}
              className="flex-1 min-h-[48px] bg-amber-500 hover:bg-amber-600"
            >
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Customize step */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Customize Your Goal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Show selected template info if applicable */}
              {selectedTemplate && (
                <div
                  className={cn(
                    'p-3 rounded-xl mb-4',
                    'bg-slate-50 dark:bg-slate-800',
                    'border border-slate-200 dark:border-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <selectedTemplate.icon className={cn('h-5 w-5', selectedTemplate.color)} />
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {selectedTemplate.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <CustomGoalFields formData={formData} onChange={handleFormChange} />

              {/* End date (optional) */}
              <div>
                <Label htmlFor="end-date" className="text-slate-700 dark:text-slate-300">
                  End Date (optional)
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleFormChange({ endDate: e.target.value })}
                  className="mt-1.5 min-h-[44px]"
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Leave empty for an ongoing goal
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('template')}
              className="flex-1 min-h-[48px]"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name || formData.targetValue < 1}
              className="flex-1 min-h-[48px] bg-amber-500 hover:bg-amber-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Goal'
              )}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}

export type { GoalType, GoalFormData, GoalFormProps };
