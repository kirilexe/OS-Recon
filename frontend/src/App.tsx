import { useState } from 'react';

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
            <h4 style={{ color: '#ff3333', borderBottom: '1px dashed #ff3333', paddingBottom: '0.5rem' }}>HIGH INTEREST TARGET ASSETS ({scanData.metrics.interesting_count})</h4>
            {scanData.interesting.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No high priority indicators flagged inside asset metadata.</p>
            ) : (
              scanData.interesting.map((repo: any, idx: number) => (
                <div key={idx} style={{ background: '#221111', border: '1px solid #ff3333', padding: '1rem', margin: '1rem 0', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#ff6666', fontSize: '1.1rem' }}>{repo.name}</strong>
                    <span style={{ fontSize: '0.85rem', background: '#331111', padding: '0.2rem 0.5rem', border: '1px solid #ff3333' }}>★ {repo.stars} | {repo.language}</span>
                  </div>
                  <p style={{ color: '#ccc', margin: '0.5rem 0' }}>{repo.description || "No project description provided."}</p>
                  <div style={{ marginTop: '0.5rem' }}>
                    {repo.reasons.map((reason: string, rIdx: number) => (
                      <div key={rIdx} style={{ color: '#ff9999', fontSize: '0.85rem' }}>• {reason}</div>
                    ))}
                  </div>
                </div>
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
              <div style={{ border: '1px solid #222', borderTop: 'none', background: '#111', padding: '1rem' }}>
                {scanData.standard.length === 0 ? (
                  <p style={{ color: '#666' }}>No generic logs found.</p>
                ) : (
                  <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                        <th style={{ padding: '0.5rem' }}>Asset Identifier</th>
                        <th style={{ padding: '0.5rem' }}>Environment</th>
                        <th style={{ padding: '0.5rem' }}>Metrics</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanData.standard.map((repo: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{repo.name}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#aaa' }}>{repo.language}</td>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#888' }}>★ {repo.stars}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default App;