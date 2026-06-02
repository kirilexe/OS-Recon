
interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function TabNavigation({ activeTab, setActiveTab }: TabNavigationProps) {
  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'analytics', label: 'ANALYTICS' },
    { id: 'deep pry', label: 'DEEP PRY'},
  ];

  return (
    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #333', paddingBottom: '1rem', marginBottom: '2rem' }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: isActive ? '#00ff66' : '#141414',
              color: isActive ? '#000' : '#00ff66',
              border: isActive ? 'none' : '1px solid #00ff66',
              padding: '0.75rem 1.75rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
