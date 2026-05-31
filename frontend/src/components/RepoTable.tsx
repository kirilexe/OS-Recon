import React, { useState } from 'react';

interface TableRepoItem {
  name: string;
  language: string;
  stars: number;
}

// Added username to props so the backend knows who owns the repo
interface RepoTableProps {
  repos: TableRepoItem[];
  username: string; 
}

export function RepoTable({ repos, username }: RepoTableProps) {
  // Track which specific repo is expanded by storing its name string
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [commits, setCommits] = useState<any[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const analyzeCommits = async (repoName: string) => {
    if (!repoName) return;

    // Toggle logic: if they click the already open repo, collapse it and stop
    if (expandedRepo === repoName) {
      setExpandedRepo(null);
      setCommits(null);
      return;
    }

    setIsScanning(true);
    setCommits(null);
    setExpandedRepo(repoName); // Open the accordion row immediately to show a loading state

    try {
      const response = await fetch('http://127.0.0.1:8000/api/scanCommits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sending both target (repo name) and username context to the backend
        body: JSON.stringify({ target: repoName, username: username }),
      });
      const res = await response.json();
      if (res.status === "completed") {
        setCommits(res.data);
      }
    } catch (error) {
      console.error("Connection error", error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div style={{ border: '1px solid #222', borderTop: 'none', background: '#111', padding: '1rem' }}>
      {repos.length === 0 ? (
        <p style={{ color: '#666' }}>No generic logs found.</p>
      ) : (
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ padding: '0.5rem' }}>Asset Identifier</th>
              <th style={{ padding: '0.5rem' }}>Environment</th>
              <th style={{ padding: '0.5rem' }}>Metrics</th>
              <th style={{ padding: '0.5rem' }}>Info</th>
            </tr>
          </thead>
          <tbody>
            {repos.map((repo, idx) => {
              const isCurrentRepoOpen = expandedRepo === repo.name;

              return (
                <React.Fragment key={idx}>
                  {/* MAIN DATA ROW */}
                  <tr style={{ borderBottom: isCurrentRepoOpen ? 'none' : '1px solid #222' }}>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#fff' }}>{repo.name}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#aaa' }}>{repo.language}</td>
                    <td style={{ padding: '0.75rem 0.5rem', color: '#888' }}>★ {repo.stars}</td>
                    <td style={{ padding: '0.75rem 0.5rem' }}> 
                      <button
                        onClick={() => analyzeCommits(repo.name)}
                        style={{
                          background: isCurrentRepoOpen ? '#ff3333' : '#222',
                          color: '#fff',
                          border: '1px solid #444',
                          padding: '0.35rem 0.75rem',
                          cursor: 'pointer',
                          fontFamily: 'monospace'
                        }}
                      >
                        {isCurrentRepoOpen ? 'Close' : 'Analyze Commits'}
                      </button> 
                    </td>
                  </tr>

                  {/* INJECTED DROPDOWN ACCORDION ROW */}
                  {isCurrentRepoOpen && (
                    <tr style={{ borderBottom: '1px solid #222', background: '#0a0a0a' }}>
                      <td colSpan={4} style={{ padding: '1rem' }}>
                        <div style={{ borderLeft: '2px solid #00ff66', paddingLeft: '1rem' }}>
                          <h4 style={{ margin: '0 0 0.75rem 0', color: '#00ff66', fontSize: '0.9rem' }}>
                            // COMMIT LOG STREAM FOR: {repo.name.toUpperCase()}
                          </h4>
                          
                          {isScanning && (
                            <p style={{ color: '#888', margin: 0, fontStyle: 'italic' }}>Interrogating target repository histories...</p>
                          )}

                          {!isScanning && commits && commits.length === 0 && (
                            <p style={{ color: '#666', margin: 0 }}>No dynamic commits recorded on public trunk.</p>
                          )}

                          {!isScanning && commits && commits.map((commit: any, cIdx: number) => (
                            <div key={cIdx} style={{ margin: '0.5rem 0', fontSize: '0.85rem', display: 'flex', gap: '1rem' }}>
                              <span style={{ color: '#00ff66' }}>[{commit.sha}]</span>
                              <span style={{ color: '#aaa', minWidth: '120px' }}>{commit.author}:</span>
                              <span style={{ color: '#fff' }}>{commit.message}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}