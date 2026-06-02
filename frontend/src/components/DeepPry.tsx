import React from 'react';
import { useScanner } from '../context/ScannerContext';

export function DeepPryLaunchpad() {
  const { stagedProfiles, removeProfile, clearStage } = useScanner();
  
  const stagedArray = Object.values(stagedProfiles);

  const handleExecuteDeepPry = async () => {
    if (stagedArray.length === 0) return;

    try {
      // TODO: Create API endpoint /pry
      const response = await fetch('http://127.0.0.1:8000/api/pry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: stagedArray }),
      });
      
      const data = await response.json();
      console.log("Background nodriver processes spawned safely:", data);
    } catch (err) {
      console.error("Critical failure handing payload down to FastAPI engine:", err);
    }
  };

  if (stagedArray.length === 0) {
    return (
      <div style={{ background: '#141414', border: '1px dashed #333', padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ color: '#666', fontFamily: 'monospace', margin: '0 0 0.5rem 0' }}>
          [!] NO SELECTED PROFILES
        </p>
        <p style={{ color: '#444', fontFamily: 'monospace', fontSize: '0.85rem', margin: 0 }}>
          Go to the social metrics tab and highlight verified target profiles to queue analytical tasks.
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1.5rem', background: '#101010', border: '1px solid #222', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #222', paddingBottom: '0.75rem' }}>
        <h3 style={{ color: '#fff', fontFamily: 'monospace', margin: 0, fontSize: '1.1rem', fontWeight: 'normal' }}>
          STAGED OSINT TARGET VERIFICATION QUEUE ({stagedArray.length})
        </h3>
        <button 
          onClick={clearStage}
          style={{ background: 'transparent', border: 'none', color: '#ff4444', fontFamily: 'monospace', fontSize: '0.8rem', cursor: 'pointer' }}
        >
          [ CLEAR ALL ]
        </button>
      </div>

      {/* Target queue stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {stagedArray.map((profile) => (
          <div 
            key={profile.site} 
            style={{ background: '#141414', border: '1px solid #222', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ fontFamily: 'monospace' }}>
              <span style={{ color: '#00ff66', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem' }}>
                {profile.site}
              </span>
              <span style={{ color: '#666', fontSize: '0.8rem', marginLeft: '0.75rem' }}>
                category: {profile.category} | target identity: @{profile.username}
              </span>
              <p style={{ color: '#888', fontSize: '0.8rem', margin: '4px 0 0 0' }}>{profile.url}</p>
            </div>
            
            <button 
              onClick={() => removeProfile(profile.site)}
              style={{
                background: 'transparent',
                border: '1px solid #ff444440',
                color: '#ff4444',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#ff444415'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              REMOVE
            </button>
          </div>
        ))}
      </div>

      {/* Launch Action */}
      <button 
        onClick={handleExecuteDeepPry}
        style={{
          width: '100%',
          background: '#00ff66',
          color: '#000',
          border: 'none',
          fontFamily: 'monospace',
          fontSize: '1rem',
          fontWeight: 'bold',
          padding: '1rem',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#00cc55'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#00ff66'}
      >
        INITIALIZE STEALTH DEEP RECON
      </button>
    </div>
  );
}