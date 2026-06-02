import React, { useState } from 'react';
import { useScanner } from '../context/ScannerContext';

interface StagedProfile {
  url: string;
  site: string;
  username: string;
  category: string;
}

interface PlatformSpecificMetrics {
  followers?: string;
  following?: string;
  posts?: string;
  likes?: string;
  karma?: string;
  cake_day?: string;
  [key: string]: any;
}

interface PryMetrics {
  display_name: string;
  avatar_url: string;
  bio: string;
  external_links: string[];
  platform_specific: PlatformSpecificMetrics;
}

interface PryResult {
  url: string;
  site: string;
  username: string;
  status: 'Verified' | 'Failed' | 'Error' | string;
  metrics: PryMetrics | null;
  error: string | null;
}

interface ApiResponse {
  status: string;
  engine: string;
  data: PryResult[];
}

const cleanRawValue = (val: any): string => {
  if (val === undefined || val === null) return '';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object') return JSON.stringify(val);

  const valStr = String(val).trim();

  const valueMatch = valStr.match(/['"]value['"]:\s*['"](.+?)['"]/);
  if (valueMatch && valueMatch[1]) return valueMatch[1];

  if (valStr.startsWith('[') && valStr.endsWith(']')) {
    const cleaned = valStr.replace(/[\[\]']/g, '').split(',');
    return cleaned[cleaned.length - 1]?.trim() || valStr;
  }

  return valStr;
};

export function DeepPryLaunchpad(): React.JSX.Element {
  const { stagedProfiles, removeProfile, clearStage } = useScanner() as {
    stagedProfiles: Record<string, StagedProfile>;
    removeProfile: (site: string) => void;
    clearStage: () => void;
  };

  const stagedArray: StagedProfile[] = Object.values(stagedProfiles);

  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<PryResult[] | null>(null);
  const [showQueue, setShowQueue] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [expandedIndex, setExpandedIndex] = useState<Record<number, boolean>>({ 0: true });
  const [showAdvancedMetadata, setShowAdvancedMetadata] = useState<Record<number, boolean>>({});

  const toggleExpand = (idx: number) => {
    setExpandedIndex(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAdvanced = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAdvancedMetadata(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleExecuteDeepPry = async (): Promise<void> => {
    if (stagedArray.length === 0) return;
    setLoading(true);
    setResults(null);
    setApiError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/pry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: stagedArray }),
      });

      if (!response.ok) throw new Error(`HTTP Engine error: Status ${response.status}`);

      const resData: ApiResponse = await response.json();
      if (resData.status === 'completed' || resData.status === 'success') {
        setResults(resData.data);
        setShowQueue(false);
        setExpandedIndex({ 0: true });
      } else {
        setApiError("Recon engine finished with an unhandled execution status.");
      }
    } catch (err) {
      console.error("Critical failure handing payload down to FastAPI engine:", err);
      setApiError(err instanceof Error ? err.message : "Failed to establish route to automation backend.");
    } finally {
      setLoading(false);
    }
  };

  if (stagedArray.length === 0 && !results) {
    return (
      <div style={{ background: '#141414', border: '1px dashed #333', padding: '3rem', textAlign: 'center', marginTop: '1.5rem' }}>
        <p style={{ color: '#666', fontFamily: 'monospace', margin: '0 0 0.5rem 0' }}>[!] NO SELECTED PROFILES</p>
        <p style={{ color: '#444', fontFamily: 'monospace', fontSize: '0.85rem', margin: 0 }}>Go to the social metrics tab and stage target profiles to queue analytical tasks.</p>
      </div>
    );
  }

  const getHostname = (urlStr: string): string => {
    try { return new URL(urlStr).hostname.replace('www.', ''); } catch { return urlStr; }
  };

  const cardStyle = {
    bg: '#141414',
    border: '1px solid #222',
    headerBg: '#111',
    text: '#fff',
    accent: '#00ff66',
    muted: '#666'
  };

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {apiError && (
        <div style={{ background: '#2a1414', border: '1px solid #ff4444', padding: '1rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.85rem', color: '#ff6666' }}>
          [!] CRITICAL ENGINE ERROR: {apiError}
        </div>
      )}

      {results && (
        <div style={{ background: '#101010', border: cardStyle.border, padding: '1.5rem', borderRadius: '4px' }}>
          <h3 style={{ color: cardStyle.accent, fontFamily: 'monospace', margin: '0 0 1.25rem 0', fontSize: '1rem', fontWeight: 'normal' }}>
            [+] ACTIVE PROFILES ({results.length} RESOLVED)
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {results.map((target: PryResult, idx: number) => {
              const { metrics, status, error, site, username, url } = target;
              const isExpanded = !!expandedIndex[idx];

              const platformEntries = Object.entries(metrics?.platform_specific || {}).filter(
                ([_, val]) => val !== undefined && val !== null && val !== '' && JSON.stringify(val) !== '{}'
              );

              return (
                <div key={`${site}-${username}-${idx}`} style={{ background: cardStyle.bg, border: isExpanded ? `1px solid ${cardStyle.accent}40` : cardStyle.border, borderRadius: '4px', overflow: 'hidden', transition: 'all 0.2s ease' }}>

                  {/* Header Row */}
                  <div
                    onClick={() => toggleExpand(idx)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: cardStyle.headerBg, cursor: 'pointer', userSelect: 'none', borderBottom: isExpanded ? cardStyle.border : 'none' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#181818'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = cardStyle.headerBg; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {/* Avatar Wrapper Container with Anti-403 Inline DOM Switch */}
                      <div style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#1c1c1c', border: '1px solid #333', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {metrics?.avatar_url ? (
                          <img
                            src={metrics.avatar_url}
                            alt="avatar"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallbackContainer = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallbackContainer) fallbackContainer.style.display = 'flex';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : null}
                        <div
                          style={{
                            display: metrics?.avatar_url ? 'none' : 'flex',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontFamily: 'monospace',
                            color: cardStyle.muted,
                            fontWeight: 'bold'
                          }}
                        >
                          {(cleanRawValue(metrics?.display_name) || username).slice(0, 2).toUpperCase()}
                        </div>
                      </div>

                      <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: cardStyle.accent, fontWeight: 'bold', fontSize: '0.7rem', textTransform: 'uppercase', background: '#16251b', padding: '1px 5px', borderRadius: '2px', border: '1px solid #00ff6620' }}>
                            {site}
                          </span>
                          <strong style={{ color: '#fff', fontSize: '0.85rem' }}>
                            {cleanRawValue(metrics?.display_name) || username}
                          </strong>
                        </div>
                        <span style={{ color: cardStyle.muted, fontSize: '0.75rem' }}>@{username}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      <span style={{ color: status === 'Verified' ? cardStyle.accent : '#ff4444', fontWeight: 'bold', background: status === 'Verified' ? '#16251b' : '#2d1616', padding: '2px 6px', borderRadius: '3px' }}>
                        {status.toUpperCase()}
                      </span>
                      <span style={{ color: cardStyle.muted, width: '15px', textAlign: 'center' }}>{isExpanded ? '[-]' : '[+]'}</span>
                    </div>
                  </div>

                  {/* Body Details */}
                  {isExpanded && (
                    <div style={{ padding: '1rem', background: cardStyle.bg, fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {error || status === 'Error' || status === 'Failed' ? (
                        <p style={{ color: '#ff4444', margin: 0 }}>[!] Engine Halt: {error || 'Footprint reconnaissance failed.'}</p>
                      ) : metrics ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                          {metrics.bio && (
                            <div style={{ color: '#aaa', background: '#0a0a0a', padding: '0.6rem 0.75rem', borderLeft: `2px solid ${cardStyle.accent}`, borderRadius: '2px', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                              <span style={{ color: cardStyle.muted, fontSize: '0.7rem', display: 'block', marginBottom: '2px', fontWeight: 'bold' }}>BIOGRAPHY EXTRACT:</span>
                              {cleanRawValue(metrics.bio)}
                            </div>
                          )}

                          {/* Dynamic Telemetry Block */}
                          {platformEntries.length > 0 && (
                            <div style={{ background: '#0d0d0d', border: cardStyle.border, padding: '0.75rem', borderRadius: '4px' }}>
                              <div style={{ color: cardStyle.muted, fontSize: '0.7rem', marginBottom: '0.5rem', borderBottom: '1px dashed #222', paddingBottom: '0.25rem', fontWeight: 'bold' }}>
                                EXTRACTED TELEMETRY DATA:
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', color: '#ccc' }}>
                                {platformEntries.map(([key, value]) => (
                                  <div key={key} style={{ wordBreak: 'break-word' }}>
                                    <span style={{ color: cardStyle.muted }}>
                                      {key.replace(/_/g, ' ')}:
                                    </span>{' '}
                                    <strong style={{ color: cardStyle.accent, textTransform: typeof value === 'boolean' ? 'none' : 'none' }}>
                                      {cleanRawValue(value)}
                                    </strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Pivoting & Cross-References */}
                          {metrics.external_links && metrics.external_links.length > 0 && (
                            <div>
                              <div style={{ color: cardStyle.muted, fontSize: '0.7rem', marginBottom: '0.35rem', fontWeight: 'bold' }}>OUTBOUND CROSS-REFERENCES DETECTED:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                                {metrics.external_links.map((link: string, lIdx: number) => (
                                  <a key={lIdx} href={link} target="_blank" rel="noreferrer" style={{ background: '#1a1a1a', color: cardStyle.accent, fontSize: '0.75rem', padding: '2px 6px', border: cardStyle.border, borderRadius: '3px', textDecoration: 'none' }}>
                                    {getHostname(link)} ↗
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Collapsible raw fallback data */}
                          <div style={{ background: '#0d0d0d', border: cardStyle.border, borderRadius: '4px' }}>
                            <div onClick={(e) => toggleAdvanced(idx, e)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', cursor: 'pointer', userSelect: 'none', fontSize: '0.7rem', color: cardStyle.muted, borderBottom: !!showAdvancedMetadata[idx] ? '1px dashed #222' : 'none' }}>
                              <span>[ADVANCED RAW METADATA]</span>
                              <span>{!!showAdvancedMetadata[idx] ? '[-]' : '[+]'}</span>
                            </div>
                            {!!showAdvancedMetadata[idx] && (
                              <div style={{ padding: '0.6rem', fontSize: '0.7rem', color: '#999' }}>
                                <div style={{ marginBottom: '0.4rem' }}>
                                  <span style={{ color: cardStyle.muted }}>Profile Target URL:</span>{' '}
                                  <a href={url} target="_blank" rel="noreferrer" style={{ color: cardStyle.accent, textDecoration: 'none', wordBreak: 'break-all' }}>{url}</a>
                                </div>
                                <div style={{ marginTop: '0.4rem' }}>
                                  <span style={{ color: cardStyle.muted, display: 'block', marginBottom: '0.25rem' }}>RAW SPECIFICS:</span>
                                  <pre style={{ margin: 0, padding: '0.4rem', background: '#050505', border: '1px solid #1a1a1a', borderRadius: '3px', overflowX: 'auto', color: '#888', fontFamily: 'monospace' }}>
                                    {JSON.stringify(metrics.platform_specific, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            )}
                          </div>

                        </div>
                      ) : (
                        <p style={{ color: cardStyle.muted, margin: 0 }}>[!] No OSINT metrics could be retrieved for this profile target.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Target Queue */}
      <div style={{ background: '#101010', border: cardStyle.border, padding: '1.25rem', borderRadius: '4px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222', paddingBottom: '0.5rem', marginBottom: showQueue ? '1rem' : '0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ color: '#fff', fontFamily: 'monospace', margin: 0, fontSize: '0.85rem', fontWeight: 'normal' }}>
              STAGED OSINT TARGET VERIFICATION QUEUE ({stagedArray.length})
            </h3>
            {results && (
              <button onClick={() => setShowQueue(!showQueue)} style={{ background: '#222', border: cardStyle.border, color: '#aaa', fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.15rem 0.4rem', cursor: 'pointer', borderRadius: '3px' }}>
                {showQueue ? '[ HIDE TARGET QUEUE ]' : '[ SHOW TARGET QUEUE ]'}
              </button>
            )}
          </div>
          {showQueue && stagedArray.length > 0 && (
            <button onClick={clearStage} style={{ background: 'transparent', border: 'none', color: '#ff4444', fontFamily: 'monospace', fontSize: '0.75rem', cursor: 'pointer' }}>
              [ CLEAR ALL ]
            </button>
          )}
        </div>

        {showQueue && stagedArray.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            {stagedArray.map((profile: StagedProfile) => (
              <div key={`${profile.site}-${profile.username}`} style={{ background: '#141414', border: cardStyle.border, padding: '0.5rem 0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '4px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  <span style={{ color: cardStyle.accent, fontWeight: 'bold', textTransform: 'uppercase' }}>{profile.site}</span>
                  <span style={{ color: cardStyle.muted, marginLeft: '0.5rem' }}>@{profile.username}</span>
                  <p style={{ color: '#888', fontSize: '0.7rem', margin: '2px 0 0 0' }}>{profile.url}</p>
                </div>
                <button
                  onClick={() => removeProfile(profile.site)}
                  style={{ background: 'transparent', border: '1px solid #ff444440', color: '#ff4444', fontFamily: 'monospace', fontSize: '0.7rem', padding: '0.15rem 0.35rem', cursor: 'pointer', borderRadius: '3px' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ff444415'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  REMOVE
                </button>
              </div>
            ))}
          </div>
        )}

        {stagedArray.length > 0 && (
          <button
            onClick={handleExecuteDeepPry}
            disabled={loading}
            style={{ width: '100%', background: loading ? '#222' : cardStyle.accent, color: loading ? '#555' : '#000', border: loading ? '1px solid #333' : 'none', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold', padding: '0.75rem', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s', borderRadius: '4px' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#00cc55'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = cardStyle.accent; }}
          >
            {loading ? 'EXECUTING STEALTH CHROME INSTANCES...' : results ? 'RE-RUN STEALTH DEEP RECON' : 'INITIALIZE STEALTH DEEP RECON'}
          </button>
        )}
      </div>

    </div>
  );
}