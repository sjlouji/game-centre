import React, { useRef, useCallback } from 'react';

interface SwipeableProps {
  children: React.ReactNode;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onTap?: () => void;
  className?: string;
  style?: React.CSSProperties;
  // Expose touch end for complex cases like Dino ducking
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

const MIN_SWIPE_DISTANCE = 40;
const MAX_TAP_DISTANCE = 10;
const SWIPE_DIRECTION_THRESHOLD = 1.5;

const Swipeable: React.FC<SwipeableProps> = ({
  children,
  onSwipeUp,
  onSwipeDown,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  className,
  style,
  onTouchEnd,
}) => {
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartPosRef.current) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartPosRef.current || e.changedTouches.length === 0) {
      onTouchEnd?.(e);
      return;
    }
      
    const touchStartPos = touchStartPosRef.current;
    const touchEndPos = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const dx = touchEndPos.x - touchStartPos.x;
    const dy = touchEndPos.y - touchStartPos.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > MIN_SWIPE_DISTANCE) {
        if (absDx > absDy * SWIPE_DIRECTION_THRESHOLD) {
            if (dx > 0) onSwipeRight?.();
            else onSwipeLeft?.();
        } else if (absDy > absDx * SWIPE_DIRECTION_THRESHOLD) {
            if (dy > 0) onSwipeDown?.();
            else onSwipeUp?.();
        }
    } else if (distance < MAX_TAP_DISTANCE) {
        onTap?.();
    }

    onTouchEnd?.(e);
    touchStartPosRef.current = null;
  }, [onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight, onTap, onTouchEnd]);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={className}
      style={{...style, touchAction: 'none'}}
    >
      {children}
    </div>
  );
};

export default Swipeable;
