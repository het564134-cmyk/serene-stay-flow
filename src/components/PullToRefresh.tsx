import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

export const PullToRefresh = ({ children, onRefresh }: PullToRefreshProps) => {
  const { isRefreshing, pullDistance, refreshTriggerProps, refresh } = usePullToRefresh({
    threshold: 60,
    onRefresh,
  });

  const showIndicator = pullDistance > 10 || isRefreshing;
  const isTriggered = pullDistance >= 60 || isRefreshing;

  return (
    <div className="relative" {...refreshTriggerProps}>
      {/* Pull indicator */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
          showIndicator ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          top: Math.min(pullDistance + 60, 120),
        }}
      >
        <div
          className={`flex items-center justify-center w-10 h-10 rounded-full glass shadow-lg ${
            isTriggered ? 'bg-primary/20' : 'bg-background/80'
          }`}
        >
          <RefreshCw
            className={`w-5 h-5 transition-transform ${
              isRefreshing ? 'animate-spin text-primary' : ''
            } ${isTriggered && !isRefreshing ? 'text-primary' : 'text-muted-foreground'}`}
            style={{
              transform: !isRefreshing ? `rotate(${pullDistance * 3}deg)` : undefined,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: isRefreshing ? 'translateY(40px)' : `translateY(${pullDistance * 0.3}px)`,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : 'none',
        }}
      >
        {children}
      </div>

      {/* Manual refresh button for accessibility */}
      {isRefreshing && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="text-xs text-muted-foreground bg-background/80 px-3 py-1 rounded-full shadow">
            Refreshing...
          </div>
        </div>
      )}
    </div>
  );
};
