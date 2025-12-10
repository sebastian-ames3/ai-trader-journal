'use client';

import { cn } from '@/lib/utils';

interface SuccessCheckmarkProps {
  size?: number;
  className?: string;
}

export function SuccessCheckmark({ size = 64, className }: SuccessCheckmarkProps) {
  return (
    <svg
      className={cn('checkmark-success', className)}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 52 52"
      width={size}
      height={size}
    >
      <circle
        className="stroke-green-500"
        cx="26"
        cy="26"
        r="25"
        fill="none"
        strokeWidth="2"
      />
      <path
        className="stroke-green-500"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.1 27.2l7.1 7.2 16.7-16.8"
      />
    </svg>
  );
}
