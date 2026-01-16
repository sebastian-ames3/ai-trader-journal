'use client';

import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  iconClassName?: string;
}

export function HelpTooltip({
  content,
  side = 'top',
  className,
  iconClassName,
}: HelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full',
              'text-muted-foreground hover:text-foreground transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              className
            )}
            aria-label="Help"
          >
            <HelpCircle className={cn('h-4 w-4', iconClassName)} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-[250px] text-center"
        >
          <p>{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default HelpTooltip;
