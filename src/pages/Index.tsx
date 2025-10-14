import { useState } from 'react';
import { TabNavigation } from '@/components/TabNavigation';
import { RoomsTab } from '@/components/tabs/RoomsTab';
import { GuestsTab } from '@/components/tabs/GuestsTab';
import { DataTab } from '@/components/tabs/DataTab';
import { AnalyticsTab } from '@/components/tabs/AnalyticsTab';
import { MoreTab } from '@/components/tabs/MoreTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState('rooms');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'rooms':
        return <RoomsTab />;
      case 'guests':
        return <GuestsTab />;
      case 'data':
        return <DataTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'more':
        return <MoreTab />;
      default:
        return <RoomsTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
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

      {/* Bottom Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
