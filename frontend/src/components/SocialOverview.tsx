import { useState } from 'react';
import { SocialResults } from './SocialResults';
import { OverviewTab } from './OverviewTab';
import { DeepPryLaunchpad } from './DeepPry';
import { AnalyticsTab } from './AnalyticsTab';

interface SocialOverviewProps {
  socialData: any;
  gitData: any | null;
}

export function SocialOverview({ socialData, gitData }: SocialOverviewProps) {
  const [activeSection, setActiveSection] = useState<'social' | 'github' | 'deep pry' | 'analytics'>('social');
  const [showStandardList, setShowStandardList] = useState(false);
  const [pryResults, setPryResults] = useState<any[] | null>(null);

  const hasGitHub = gitData !== null;

  return (
    <div>
      {/* Section toggle — only show if GitHub data exists */}
      <div style={{
        display: 'flex', gap: '1rem', marginBottom: '1.5rem',
        borderBottom: '1px solid #333', paddingBottom: '1rem',
      }}>
        <button
          onClick={() => setActiveSection('social')}
          style={{
            background: activeSection === 'social' ? '#00ff66' : '#141414',
            color: activeSection === 'social' ? '#000' : '#00ff66',
            border: activeSection === 'social' ? 'none' : '1px solid #00ff66',
            padding: '0.75rem 1.75rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        >
          SOCIAL PROFILES
        </button>

        {hasGitHub && (
          <button
            onClick={() => setActiveSection('github')}
            style={{
              background: activeSection === 'github' ? '#00ff66' : '#141414',
              color: activeSection === 'github' ? '#000' : '#00ff66',
              border: activeSection === 'github' ? 'none' : '1px solid #00ff66',
              padding: '0.75rem 1.75rem',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'monospace',
            }}
          >
            GITHUB DETAILS
          </button>
        )}

        <button
          onClick={() => setActiveSection('deep pry')}
          style={{
            background: activeSection === 'deep pry' ? '#00ff66' : '#141414',
            color: activeSection === 'deep pry' ? '#000' : '#00ff66',
            border: activeSection === 'deep pry' ? 'none' : '1px solid #00ff66',
            padding: '0.75rem 1.75rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        >
          DEEP PRY QUEUE
        </button>

        <button
          onClick={() => setActiveSection('analytics')}
          style={{
            background: activeSection === 'analytics' ? '#00ff66' : '#141414',
            color: activeSection === 'analytics' ? '#000' : '#00ff66',
            border: activeSection === 'analytics' ? 'none' : '1px solid #00ff66',
            padding: '0.75rem 1.75rem',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontFamily: 'monospace',
          }}
        >
          ANALYTICS
        </button>
      </div>

      {/* Social section */}
      {activeSection === 'social' && (
        <SocialResults
          results={socialData.results}
          categories={socialData.categories}
          totalFound={socialData.total_found}
          totalChecked={socialData.total_checked}
          exposedEmails={gitData?.exposed_emails}
        />
      )}

      {/* GitHub deep-dive section */}
      {activeSection === 'github' && gitData && (
        <div>
          <div style={{
            background: '#141414', padding: '1rem', marginBottom: '1.5rem',
            borderLeft: '4px solid #00ff66',
          }}>
            <p style={{ color: '#aaa', fontFamily: 'monospace', fontSize: '0.85rem', margin: 0 }}>
              GitHub profile was found during the social scan. Below is a detailed analysis of the account's repositories.
            </p>
          </div>
          <OverviewTab
            scanData={gitData}
            showStandardList={showStandardList}
            setShowStandardList={setShowStandardList}
          />
        </div>
      )}

      {activeSection === 'deep pry' && (
        <DeepPryLaunchpad onPryComplete={setPryResults} pryResults={pryResults}/>
      )}

      {activeSection === 'analytics' && (
        <AnalyticsTab
          scanData={socialData}
          gitData={gitData}
          pryResults={pryResults}
        />
      )}
    </div>
  );
}