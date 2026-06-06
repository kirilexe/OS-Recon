interface AnalyticsTabProps {
  scanData: {
    username: string;
    total_found: number;
    total_checked: number;
  };
  gitData: any | null;
  pryResults: any[] | null;
}

export function AnalyticsTab({ scanData, gitData, pryResults }: AnalyticsTabProps) {
  const verified = pryResults?.filter(r => r.status === 'Verified') ?? [];
  const failed = pryResults?.filter(r => r.status !== 'Verified') ?? [];

  const allLinks = verified.flatMap(r => r.metrics?.external_links ?? []);
  const linkDomains = allLinks.map(link => {
    try { return new URL(link).hostname.replace('www.', ''); } catch { return link; }
  });
  const domainFreq = linkDomains.reduce<Record<string, number>>((acc, d) => {
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  const sortedDomains = Object.entries(domainFreq).sort((a, b) => b[1] - a[1]);

  const profilesWithBio = verified.filter(r => r.metrics?.bio?.trim()).length;
  const spreadScore = scanData.total_checked > 0
    ? ((scanData.total_found / scanData.total_checked) * 100).toFixed(1)
    : '0';

  const s = {
    label: { color: '#555', fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 'bold' as const, marginBottom: '0.25rem' },
    value: { color: '#00ff66', fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 'bold' as const },
    card: { background: '#0d0d0d', border: '1px solid #222', padding: '1rem 1.25rem', borderRadius: '4px' },
    muted: { color: '#555', fontFamily: 'monospace', fontSize: '0.75rem' },
  };

  return (
    <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Header */}
      <div style={{ background: '#141414', borderLeft: '4px solid #00ff66', padding: '1rem 1.5rem' }}>
        <p style={{ color: '#00ff66', fontFamily: 'monospace', fontSize: '0.8rem', margin: '0 0 0.3rem 0', letterSpacing: '0.1em' }}>
          ANALYTICS — {scanData.username.toUpperCase()}
        </p>
        <p style={{ ...s.muted, margin: 0 }}>
          {scanData.total_found} profiles confirmed across {scanData.total_checked} platforms scanned
        </p>
      </div>

      {!pryResults || pryResults.length === 0 ? (
        <div style={{ background: '#0d0d0d', border: '1px dashed #333', padding: '3rem 2rem', textAlign: 'center' }}>
          <p style={{ color: '#444', fontFamily: 'monospace', fontSize: '1.1rem', margin: '0 0 0.75rem 0' }}>[ NO TELEMETRY DATA ]</p>
          <p style={{ ...s.muted, lineHeight: 1.8, margin: 0 }}>
            Run <span style={{ color: '#00ff66' }}>DEEP PRY</span> on discovered profiles to unlock analytics.
            <br />
            Platform confidence scores, bio link graphs, and activity patterns
            <br />
            will populate here once telemetry is extracted.
          </p>
        </div>
      ) : (
        <>
          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'PROFILES PRIED', value: pryResults.length },
              { label: 'VERIFIED', value: verified.length },
              { label: 'FAILED / BLOCKED', value: failed.length },
              { label: 'SURFACE SPREAD', value: `${spreadScore}%` },
              { label: 'BIOS EXTRACTED', value: profilesWithBio },
              { label: 'OUTBOUND LINKS', value: allLinks.length },
            ].map(({ label, value }) => (
              <div key={label} style={s.card}>
                <div style={s.label}>{label}</div>
                <div style={s.value}>{value}</div>
              </div>
            ))}
          </div>

          {/* Confidence per profile */}
          <div style={{ background: '#101010', border: '1px solid #222', padding: '1.25rem', borderRadius: '4px' }}>
            <div style={{ ...s.label, marginBottom: '0.75rem', borderBottom: '1px dashed #222', paddingBottom: '0.4rem' }}>
              PROFILE CONFIDENCE SCORES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {verified.map((r, i) => {
                const pts = [
                  r.metrics?.bio?.trim() ? 1 : 0,
                  r.metrics?.avatar_url ? 1 : 0,
                  (r.metrics?.external_links?.length ?? 0) > 0 ? 1 : 0,
                  Object.keys(r.metrics?.platform_specific ?? {}).length > 0 ? 1 : 0,
                ];
                const score = pts.reduce((a: number, b: number) => a + b, 0);
                const pct = (score / 4) * 100;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <span style={{ color: '#00ff66', width: '90px', flexShrink: 0, textTransform: 'uppercase' }}>{r.site}</span>
                    <span style={{ color: '#555', width: '120px', flexShrink: 0 }}>@{r.username}</span>
                    <div style={{ flex: 1, background: '#1a1a1a', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: pct === 100 ? '#00ff66' : pct >= 50 ? '#aaff00' : '#ff8800', transition: 'width 0.4s ease' }} />
                    </div>
                    <span style={{ color: '#aaa', width: '35px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bio link graph */}
          {sortedDomains.length > 0 && (
            <div style={{ background: '#101010', border: '1px solid #222', padding: '1.25rem', borderRadius: '4px' }}>
              <div style={{ ...s.label, marginBottom: '0.75rem', borderBottom: '1px dashed #222', paddingBottom: '0.4rem' }}>
                OUTBOUND LINK GRAPH — CROSS-REFERENCE CLUSTERS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {sortedDomains.map(([domain, count]) => (
                  <div key={domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    <span style={{ color: '#00ff66', width: '180px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{domain}</span>
                    <div style={{ flex: 1, background: '#1a1a1a', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(count / sortedDomains[0][1]) * 100}%`, height: '100%', background: '#00ff6680' }} />
                    </div>
                    <span style={{ color: '#555', width: '60px', textAlign: 'right' }}>{count}x ref</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}