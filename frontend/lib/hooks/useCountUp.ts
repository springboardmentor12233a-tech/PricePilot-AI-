"use client";

import { useEffect, useState } from "react";

/**
 * Lightweight numeric count-up hook.
 * Smoothly interpolates from 0 (or previous value) to target value.
 */
export function useCountUp(target: number, duration: number = 650, decimals: number = 0): string {
  const [displayValue, setDisplayValue] = useState<number>(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const change = target - startValue;

    if (Math.abs(change) < 0.001) {
      setDisplayValue(target);
      return;
    }

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + change * easeOut;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [target, duration]);

  return displayValue.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
