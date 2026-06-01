import { useState } from 'react';
import { TabNavigation } from './components/TabNavigation';
import { TargetProfile } from './components/TargetProfile';
import { OverviewTab } from './components/OverviewTab';
import { AnalyticsTab } from './components/AnalyticsTab';
import { ScanProgress } from './components/ScanProgress';
import { SocialOverview } from './components/SocialOverview';

function App() {
  const [inputTarget, setInputTarget] = useState('');
  const [scanData, setScanData] = useState<any>(null);
  const [engine, setEngine] = useState<string | null>(null);
  const [gitData, setGitData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [showStandardList, setShowStandardList] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const startRecon = async () => {
    if (!inputTarget) return;
    setIsScanning(true);
    setScanData(null);
    setGitData(null);
    setEngine(null);
    setScanError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: inputTarget }),
      });

      if (!response.ok) {
        const err = await response.json();
        setScanError(err.detail || 'Scan failed.');
        return;
      }

      const res = await response.json();
      if (res.status === "completed") {
        setScanData(res.data);
        setEngine(res.engine);
        if (res.git_data) {
          setGitData(res.git_data);
        }
      }
    } catch (error) {
      console.error("Connection error", error);
      setScanError("Could not connect to the backend. Make sure the server is running.");
    } finally {
      setIsScanning(false);
    }
  };

  function clearLog() {
    setScanData(null);
    setGitData(null);
    setEngine(null);
    setScanError(null);
    setActiveTab('overview');
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isScanning) {
      startRecon();
    }
  };

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'monospace', background: '#0d0d0d', color: '#00ff66', minHeight: '100vh' }}>
      <h2>OS-Recon</h2>
      <p style={{ color: '#888', marginTop: '-0.5rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Open source intelligence scanner
      </p>

      <div style={{ margin: '2rem 0' }}>
        <input
          type="text"
          value={inputTarget}
          onChange={(e) => setInputTarget(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a username or GitHub link"
          style={{
            background: '#141414', border: '1px solid #00ff66', padding: '0.75rem',
            color: '#fff', width: '380px', marginRight: '1rem', fontFamily: 'monospace'
          }}
        />
        <button
          onClick={startRecon}
          style={{
            background: '#00ff66', color: '#000', border: 'none', padding: '0.75rem 1.75rem',
            cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace'
          }}
          disabled={isScanning}
        >
          {isScanning ? 'Scanning...' : 'Scan'}
        </button>
        {scanData && (
          <button
            onClick={clearLog}
            disabled={isScanning}
            style={{
              background: 'transparent', color: '#888', border: '1px solid #333', padding: '0.75rem 1.75rem',
              cursor: 'pointer', fontFamily: 'monospace', marginLeft: '0.5rem'
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Scan progress animation */}
      <ScanProgress isScanning={isScanning} />

      {/* Error display */}
      {scanError && (
        <div style={{
          background: '#1a1111', border: '1px solid #ff333360', padding: '1rem',
          marginTop: '1.5rem', fontFamily: 'monospace', color: '#ff6666', fontSize: '0.9rem',
        }}>
          {scanError}
        </div>
      )}

      {/* Results */}
      {scanData && engine === 'git' && (
        <div style={{ marginTop: '2rem' }}>
          <TargetProfile scanData={scanData} />

          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

          {activeTab === 'overview' ? (
            <OverviewTab
              scanData={scanData}
              showStandardList={showStandardList}
              setShowStandardList={setShowStandardList}
            />
          ) : (
            <AnalyticsTab scanData={scanData} />
          )}
        </div>
      )}

      {scanData && engine === 'social' && (
        <div style={{ marginTop: '2rem' }}>
          {/* Social scan header */}
          <div style={{
            background: '#141414', padding: '1rem', borderLeft: '4px solid #00ff66', marginBottom: '2rem',
          }}>
            <h3 style={{ margin: 0, color: '#fff' }}>
              Username: {scanData.username}
            </h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#aaa', fontSize: '0.9rem' }}>
              Scanned {scanData.total_checked} platforms - found {scanData.total_found} matching profiles
              {gitData && ' - GitHub account detected, repository data included below'}
            </p>
          </div>

          <SocialOverview socialData={scanData} gitData={gitData} />
        </div>
      )}
    </div>
  );
}

export default App;