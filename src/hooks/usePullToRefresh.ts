import { useState, useCallback, useRef, TouchEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UsePullToRefreshOptions {
  threshold?: number;
  onRefresh?: () => Promise<void>;
}

export const usePullToRefresh = (options: UsePullToRefreshOptions = {}) => {
  const { threshold = 80, onRefresh } = options;
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling.current) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    // Apply resistance to pull
    const resistedDistance = Math.min(distance * 0.5, 120);
    setPullDistance(resistedDistance);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        // Invalidate all queries to refresh data
        await queryClient.invalidateQueries();
        
        // Call custom onRefresh if provided
        if (onRefresh) {
          await onRefresh();
        }
      } finally {
        // Small delay for visual feedback
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, queryClient, onRefresh]);

  const refreshTriggerProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };

  return {
    isRefreshing,
    pullDistance,
    refreshTriggerProps,
    refresh: async () => {
      setIsRefreshing(true);
      await queryClient.invalidateQueries();
      if (onRefresh) await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    },
  };
};
