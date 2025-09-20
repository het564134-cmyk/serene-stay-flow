import { Home, Users, Database, BarChart3, Settings } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const TabNavigation = ({ activeTab, onTabChange }: TabNavigationProps) => {
  const tabs = [
    { id: 'rooms', icon: Home, label: 'Rooms' },
    { id: 'guests', icon: Users, label: 'Guests' },
    { id: 'data', icon: Database, label: 'Data' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'more', icon: Settings, label: 'More' },
  ];

  return (
    <nav className="tab-navigation">
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            activeTab === id
              ? 'text-primary neon-text scale-110'
              : 'text-muted-foreground hover:text-foreground hover:scale-105'
          }`}
        >
          <Icon className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">{label}</span>
        </button>
      ))}
    </nav>
  );
};