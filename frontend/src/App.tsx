import { useState } from 'react';
import { Repo } from './components/Repo';
import { RepoTable } from './components/RepoTable';

function App() {
  const [inputTarget, setInputTarget] = useState('');
  const [scanData, setScanData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showStandardList, setShowStandardList] = useState(false);

  const startRecon = async () => {
    if (!inputTarget) return;
    setIsScanning(true);
    setScanData(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: inputTarget }),
      });
      const res = await response.json();
      if (res.status === "completed") {
        setScanData(res.data);
      }
    } catch (error) {
      console.error("Connection error", error);
    } finally {
      setIsScanning(false);
    }
  };
  
  function clearLog() {
    setScanData(null);
  }

  return (
    <div style={{ padding: '2.5rem', fontFamily: 'monospace', background: '#0d0d0d', color: '#00ff66', minHeight: '100vh' }}>
      <h2>// OS-RECON SYSTEM // DASHBOARD ENGINE</h2>
      
      {/* Search Input Control */}
      <div style={{ margin: '2rem 0' }}>
        <input 
          type="text" 
          value={inputTarget}
          onChange={(e) => setInputTarget(e.target.value)}
          placeholder="Enter target username or link... (github only atm)"
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
          {isScanning ? 'PARSING ENGINE...' : 'ANALYZE'}
        </button>
        <button
          onClick={clearLog}
          disabled={isScanning}
          style={{ 
            background: '#00ff66', color: '#000', border: 'none', padding: '0.75rem 1.75rem', 
            cursor: 'pointer', fontWeight: 'bold', fontFamily: 'monospace' 
          }}
        >
          Clear Log 
        </button>
      </div>

      {scanData && (
        <div style={{ marginTop: '2rem' }}>
          
          {/* Target Profile Summary Header Block */}
          <div style={{ background: '#141414', padding: '1rem', borderLeft: '4px solid #00ff66', marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, color: '#fff' }}>Identity: {scanData.username}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#888' }}>
              Target Link: <a href={scanData.profile_url} target="_blank" rel="noreferrer" style={{ color: '#00ff66' }}>{scanData.profile_url}</a>
            </p>
            <p style={{ margin: '0.25rem 0 0 0', color: '#aaa' }}>
              Assets Discovered: {scanData.metrics.total} total ({scanData.metrics.interesting_count} prioritized)
            </p>
          </div>

          {/* TOP SECTION: PRIORITY / HIGH INTEREST ITEMS */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h4 style={{ color: '#ff3333', borderBottom: '1px dashed #ff3333', paddingBottom: '0.5rem' }}>
              HIGH INTEREST TARGET ASSETS ({scanData.metrics.interesting_count})
            </h4>
            {scanData.interesting.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No high priority indicators flagged inside asset metadata.</p>
            ) : (
              scanData.interesting.map((repo: any, idx: number) => (
                <Repo key={idx} repo={repo} />
              ))
            )}
          </div>

          {/* BOTTOM SECTION: HIDEABLE STANDARD ASSETS LIST */}
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={() => setShowStandardList(!showStandardList)}
              style={{
                background: '#222', color: '#fff', border: '1px solid #444', padding: '0.5rem 1rem',
                cursor: 'pointer', fontFamily: 'monospace', width: '100%', textAlign: 'left',
                display: 'flex', justifyContent: 'space-between'
              }}
            >
              <span>{showStandardList ? '▼ HIDE' : '▶ SHOW'} ALL OTHER RECORDED FOOTPRINTS ({scanData.metrics.standard_count})</span>
              <span>{showStandardList ? 'Collapse' : 'Expand'}</span>
            </button>

            {showStandardList && (
              <RepoTable repos={scanData.standard} username={scanData.username} />
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;