import { useState, memo } from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { RoomsTab } from '@/components/tabs/RoomsTab';
import { GuestsTab } from '@/components/tabs/GuestsTab';
import { DataTab } from '@/components/tabs/DataTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { MoreTab } from '@/components/tabs/MoreTab';
import { PullToRefresh } from '@/components/PullToRefresh';

// Memoize tabs to prevent unnecessary re-renders
const MemoizedRoomsTab = memo(RoomsTab);
const MemoizedGuestsTab = memo(GuestsTab);
const MemoizedDataTab = memo(DataTab);
const MemoizedAnalyticsTab = memo(AnalyticsTab);
const MemoizedMoreTab = memo(MoreTab);

const Index = () => {
  const [activeTab, setActiveTab] = useState('rooms');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'rooms':
        return <MemoizedRoomsTab />;
      case 'guests':
        return <MemoizedGuestsTab />;
      case 'data':
        return <MemoizedDataTab />;
      case 'analytics':
        return <MemoizedAnalyticsTab />;
      case 'more':
        return <MemoizedMoreTab />;
      default:
        return <MemoizedRoomsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PullToRefresh>
        {/* Header */}
        <header className="glass-card m-3 sm:m-4 mb-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-2">
            <h1 className="text-lg sm:text-xl font-bold neon-text">Madhav Management</h1>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Professional Management System
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="min-h-screen">
          {renderActiveTab()}
        </main>
      </PullToRefresh>

      {/* Bottom Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
