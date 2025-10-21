'use client';

import { IvDisplayData } from '@/lib/types/iv';
import { formatIvDisplay } from '@/lib/iv';
import { Badge } from '@/components/ui/badge';

interface IvBadgeProps {
  data: IvDisplayData | null;
  className?: string;
}

export default function IvBadge({ data, className }: IvBadgeProps) {
  if (!data) return null;
  
  const displayText = formatIvDisplay(data.ivPct, data.ivTermDays);
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(data.ivAt);
  
  return (
    <Badge variant="secondary" className={className}>
      <span className="font-medium">IV {displayText}</span>
      <span className="mx-2">•</span>
      <span className="text-xs">{dateStr}</span>
    </Badge>
  );
}