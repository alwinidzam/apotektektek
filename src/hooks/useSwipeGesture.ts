import { useRef, TouchEvent } from "react";

export interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onEdgeSwipeRight?: () => void;
  minDistance?: number; // Minimum horizontal pixel delta
  maxVerticalDistance?: number; // Maximum vertical pixel delta to avoid scroll conflicts
  maxDurationMs?: number; // Maximum swipe duration
  edgeThreshold?: number; // Pixel distance from screen left edge for back gesture
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onEdgeSwipeRight,
  minDistance = 45,
  maxVerticalDistance = 65,
  maxDurationMs = 600,
  edgeThreshold = 40,
}: SwipeGestureOptions) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number>(0);

  const onTouchStart = (e: TouchEvent) => {
    // Only track single touch
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartX.current;
    const deltaY = endY - touchStartY.current;
    const duration = Date.now() - touchStartTime.current;

    const isHorizontalDominant =
      Math.abs(deltaX) >= minDistance &&
      Math.abs(deltaY) <= maxVerticalDistance &&
      Math.abs(deltaX) > Math.abs(deltaY) * 1.3 &&
      duration <= maxDurationMs;

    if (isHorizontalDominant) {
      if (deltaX > 0) {
        // Swiped Right ->
        if (touchStartX.current <= edgeThreshold && onEdgeSwipeRight) {
          // Edge swipe from left boundary (Classic iOS back gesture)
          onEdgeSwipeRight();
        } else if (onSwipeRight) {
          onSwipeRight();
        }
      } else {
        // Swiped Left <-
        if (onSwipeLeft) {
          onSwipeLeft();
        }
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return {
    onTouchStart,
    onTouchEnd,
  };
}
