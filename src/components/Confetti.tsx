'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  pieceCount?: number;
}

const COLORS = [
  '#f59e0b', // amber
  '#ef4444', // red
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ec4899', // pink
  '#f97316', // orange
];

export function Confetti({ isActive, duration = 3000, pieceCount = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setPieces([]);
      return;
    }

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    // Generate confetti pieces
    const newPieces: ConfettiPiece[] = Array.from({ length: pieceCount }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // percentage
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5, // seconds
      size: Math.random() * 8 + 6, // 6-14px
    }));

    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, duration, pieceCount]);

  if (!mounted || pieces.length === 0) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>,
    document.body
  );
}

// Hook to trigger confetti on streak milestones
export function useStreakConfetti(currentStreak: number) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [lastCelebratedStreak, setLastCelebratedStreak] = useState(0);

  useEffect(() => {
    const milestones = [7, 14, 21, 30, 60, 90, 100, 180, 365];

    if (
      currentStreak > lastCelebratedStreak &&
      milestones.includes(currentStreak)
    ) {
      setShowConfetti(true);
      setLastCelebratedStreak(currentStreak);

      // Hide confetti after animation
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3500);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [currentStreak, lastCelebratedStreak]);

  return showConfetti;
}
