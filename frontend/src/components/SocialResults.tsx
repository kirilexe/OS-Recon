import React, { useState } from 'react';
import { useScanner } from '../context/ScannerContext';

interface SocialResult {
  site: string;
  url: string;
  category: string;
  username: string;
  status: number | string; // Updated to support both status codes and string flags like "Blocked"
}

interface SocialResultsProps {
  results: SocialResult[];
  categories: Record<string, SocialResult[]>;
  totalFound: number;
  totalChecked: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  development: "Development",
  social: "Social Media",
  gaming: "Gaming",
  media: "Media & Content",
  blogging: "Blogging",
  professional: "Professional",
  design: "Design",
  security: "Security",
};

const CATEGORY_COLORS: Record<string, string> = {
  development: "#00ff66",
  social: "#3b82f6",
  gaming: "#a855f7",
  media: "#f59e0b",
  blogging: "#ec4899",
  professional: "#06b6d4",
  design: "#f43f5e",
  security: "#10b981",
};

export function SocialResults({ results, categories, totalFound, totalChecked }: SocialResultsProps) {
  // State tracking for which username blocks are toggled open
  // Key format: "category-username"
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  const { stagedProfiles, toggleProfile } = useScanner();

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (results.length === 0) {
    return (
      <div style={{ 
        background: '#141414', border: '1px dashed #333', padding: '2rem', 
        textAlign: 'center', margin: '1.5rem 0' 
      }}>
        <p style={{ color: '#888', fontFamily: 'monospace', margin: 0 }}>
          No profiles found for this username across {totalChecked} platforms.
        </p>
      </div>
    );
  }

  const sortedCategories = Object.entries(categories).sort((a, b) => b[1].length - a[1].length);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      {/* Summary bar */}
      <div style={{
        background: '#141414', padding: '1rem 1.25rem', marginBottom: '1.5rem',
        borderLeft: '4px solid #00ff66', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem',
      }}>
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.95rem' }}>
          Found <strong style={{ color: '#00ff66' }}>{totalFound}</strong> profiles across{' '}
          <strong style={{ color: '#888' }}>{totalChecked}</strong> platforms
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {sortedCategories.map(([cat, items]) => (
            <span
              key={cat}
              style={{
                background: `${CATEGORY_COLORS[cat] || '#888'}18`,
                color: CATEGORY_COLORS[cat] || '#888',
                border: `1px solid ${CATEGORY_COLORS[cat] || '#888'}40`,
                padding: '0.2rem 0.6rem',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                borderRadius: '2px',
              }}
            >
              {CATEGORY_LABELS[cat] || cat}: {items.length}
            </span>
          ))}
        </div>
      </div>

      {/* Category groups */}
      {sortedCategories.map(([category, items]) => {
        const color = CATEGORY_COLORS[category] || '#888';
        const label = CATEGORY_LABELS[category] || category;

        // Group the items within this category by their attempted username variations
        const itemsByUsername = items.reduce((acc, item) => {
          if (!acc[item.username]) {
            acc[item.username] = [];
          }
          acc[item.username].push(item);
          return acc;
        }, {} as Record<string, SocialResult[]>);

        return (
          <div key={category} style={{ marginBottom: '1.5rem' }}>
            <h4 style={{
              color: color, fontFamily: 'monospace', fontSize: '0.9rem',
              margin: '0 0 0.75rem 0', paddingBottom: '0.5rem',
              borderBottom: `1px solid ${color}40`,
              textTransform: 'uppercase',
            }}>
              {label} ({items.length})
            </h4>

            {/* Username Dropdowns Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(itemsByUsername).map(([username, userResults]) => {
                const dropdownKey = `${category}-${username}`;
                const isOpen = !!openDropdowns[dropdownKey];

                return (
                  <div key={username} style={{ background: '#101010', border: '1px solid #222' }}>
                    {/* Dropdown Header Trigger */}
                    <div
                      onClick={() => toggleDropdown(dropdownKey)}
                      style={{
                        background: '#141414',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        userSelect: 'none',
                        borderBottom: isOpen ? '1px solid #222' : 'none',
                      }}
                    >
                      <span style={{ color: color, fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        @{username}
                      </span>
                      <span style={{ color: '#666', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {isOpen ? '▲ CLOSE' : `▼ EXPAND (${userResults.length})`}
                      </span>
                    </div>

                    {/* Conditional Dropdown Grid Body */}
                    {isOpen && (
                      <div style={{
                        padding: '0.75rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '0.5rem',
                        background: '#0d0d0d'
                      }}>
                        {userResults.map((result, idx) => {
                          const isBlocked = result.status === 'Blocked';
                          const isStaged = !!stagedProfiles[result.site];

                          return (
                            <a
                              key={idx}
                              href={result.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                background: isStaged ? '#111612' : '#141414',
                                border: isStaged ? '1px solid #00ff6650' : isBlocked ? '1px dashed #f59e0b50' : `1px solid ${color}30`,
                                padding: '0.75rem 1rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                textDecoration: 'none',
                                transition: 'border-color 0.2s, background 0.2s',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = isStaged ? '#00ff66' : isBlocked ? '#f59e0b' : color;
                                e.currentTarget.style.background = isStaged ? '#141f16' : '#1a1a1a';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = isStaged ? '#00ff6650' : isBlocked ? '#f59e0b50' : `${color}30`;
                                e.currentTarget.style.background = isStaged ? '#111612' : '#141414';
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                                  {result.site}
                                </span>
                              </div>
                              
                              {/* Conditionally render dynamic state tags */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {isBlocked ? (
                                  <span style={{
                                    color: '#f59e0b',
                                    background: '#f59e0b15',
                                    border: '1px solid #f59e0b40',
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '2px'
                                  }}>
                                    BLOCKED
                                  </span>
                                ) : (
                                  <span style={{
                                    color: '#00ff66',
                                    background: '#00ff6610',
                                    border: '1px solid #00ff6630',
                                    fontSize: '0.7rem',
                                    fontFamily: 'monospace',
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '2px'
                                  }}>
                                    FOUND
                                  </span>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleProfile(result);
                                  }}
                                  style={{
                                    background: isStaged ? '#00ff66' : 'transparent',
                                    color: isStaged ? '#000' : '#666',
                                    border: isStaged ? '1px solid #00ff66' : '1px solid #444',
                                    fontFamily: 'monospace',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '2px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                  }}
                                >
                                  {isStaged ? 'STAGED' : 'PRY'}
                                </button>
                                <span style={{ color: '#444', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                  ↗
                                </span>
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}