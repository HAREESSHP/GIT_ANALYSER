import './Dashboard.css';
import { useState, useEffect } from 'react';
import api from '../services/api.js';
import AIAssistant from './AIAssistant';

export default function Dashboard({ data }) {
  if (!data) return null;

  const { profile, analytics, topRepositories, techStack, activityMetrics } = data;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkStatus, setBookmarkStatus] = useState('interested');
  const [bookmarkNotes, setBookmarkNotes] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    // Check if profile is bookmarked on component mount
    checkBookmarkStatus();
  }, [profile.username]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await api.get(`/api/bookmarks/${profile.username}`);
      if (response.data.bookmark) {
        setIsBookmarked(true);
        setBookmarkStatus(response.data.bookmark.status);
        setBookmarkNotes(response.data.bookmark.notes);
      }
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      if (isBookmarked) {
        await api.delete(`/api/bookmarks/${profile.username}`);
        setIsBookmarked(false);
        setBookmarkStatus('interested');
        setBookmarkNotes('');
      } else {
        await api.post('/api/bookmarks', {
          username: profile.username,
          notes: bookmarkNotes,
          status: bookmarkStatus,
        });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const getActivityEmoji = () => {
    if (activityMetrics?.activityLevel.includes('very active')) return '🔥';
    if (activityMetrics?.activityLevel.includes('active')) return '✅';
    if (activityMetrics?.activityLevel.includes('moderately')) return '⚠️';
    return '⏸️';
  };

  const getDeveloperLevelColor = () => {
    switch (activityMetrics?.developerLevel) {
      case 'Senior':
        return '#ffd700';
      case 'Mid-Level':
        return '#c0c0c0';
      default:
        return '#cd7f32';
    }
  };

  return (
    <section id="dashboard" className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-header-title">
            <h2>Profile Analysis</h2>
            <p className="dashboard-header-subtitle">Detailed insights for @{profile.username}</p>
          </div>
          <div className="header-actions">
            <button onClick={() => setChatOpen(true)} className="btn-open-chat">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
              Ask AI
            </button>
            <button
              onClick={handleToggleBookmark}
              className={`btn-bookmark ${isBookmarked ? 'bookmarked' : ''}`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark candidate'}
            >
              {isBookmarked ? '⭐' : '☆'} {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="btn-new-search">
              New Search
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <img src={profile.avatar} alt={profile.username} className="profile-avatar" />
          <div className="profile-info">
            <div className="profile-header-row">
              <div>
                <h3>{profile.name || profile.username}</h3>
                <p className="username">@{profile.username}</p>
              </div>
              <div className="profile-badges">
                <span
                  className="badge developer-level"
                  style={{ backgroundColor: getDeveloperLevelColor() }}
                >
                  {activityMetrics?.developerLevel}
                </span>
                <span className="badge activity-level" title={activityMetrics?.activityLevel}>
                  {getActivityEmoji()} {activityMetrics?.activityLevel}
                </span>
              </div>
            </div>
            {profile.bio && <p className="bio">{profile.bio}</p>}
            <div className="profile-meta">
              {profile.location && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {profile.location}
                </span>
              )}
              {profile.company && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg>
                  {profile.company}
                </span>
              )}
              {profile.website && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">Website</a>
                </span>
              )}
              {activityMetrics?.lastActivityDate && (
                <span className="profile-meta-item">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Last active: {new Date(activityMetrics.lastActivityDate).toLocaleDateString()} ({activityMetrics.daysSinceLastUpdate}d ago)
                </span>
              )}
            </div>
            <div className="profile-ask-ai-wrap">
              <p className="profile-ask-ai-label">
                <span className="profile-ask-ai-badge">RAGbot</span>
                Want to know more about this profile?
              </p>
              <button onClick={() => setChatOpen(true)} className="profile-ask-ai">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                </svg>
                ASK RAG MODEL
              </button>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat">
              <div className="stat-value">{profile.followers.toLocaleString()}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.following.toLocaleString()}</div>
              <div className="stat-label">Following</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.publicRepos}</div>
              <div className="stat-label">Repositories</div>
            </div>
            <div className="stat">
              <div className="stat-value">{profile.publicGists}</div>
              <div className="stat-label">Gists</div>
            </div>
          </div>
        </div>

        {/* Tech Stack Section */}
        {techStack && techStack.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h3>Tech Stack Breakdown</h3>
              <span className="section-tag">Languages used</span>
            </div>
            <div className="tech-stack-grid">
              {techStack.map((tech) => (
                <div key={tech.language} className="tech-item">
                  <div className="tech-header">
                    <span className="tech-name">{tech.language}</span>
                    <span className="tech-count">{tech.count} repos</span>
                  </div>
                  <div className="tech-bar">
                    <div
                      className="tech-bar-fill"
                      style={{ width: `${tech.percentage}%` }}
                    ></div>
                  </div>
                  <span className="tech-percentage">{tech.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="section-card">
          <div className="section-header">
            <h3>Key Metrics</h3>
            <span className="section-tag">Repository analytics</span>
          </div>
          <div className="analytics-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{analytics.totalStars.toLocaleString()}</div>
                <div className="stat-card-label">Total Stars</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#6366f1"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.51.12-3.15 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 0 1 3.02-.41c1.03.01 2.07.14 3.03.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.85.12 3.15.77.85 1.24 1.93 1.24 3.25 0 4.62-2.82 5.65-5.51 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.88-.01 3.27 0 .32.21.7.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{analytics.totalForks.toLocaleString()}</div>
                <div className="stat-card-label">Total Forks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#10b981"><path d="M2 3h6v4H2V3zm7 0h15v4H9V3zm-7 7h6v4H2v-4zm7 0h15v4H9v-4zm-7 7h6v4H2v-4zm7 0h15v4H9v-4z"/></svg>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{analytics.repoCount}</div>
                <div className="stat-card-label">Repositories</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#ec4899"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 11h2v6H7v-6zm4-4h2v10h-2V7zm4 7h2v3h-2v-3zm0-5h2v2h-2V9z"/></svg>
              </div>
              <div className="stat-card-content">
                <div className="stat-card-value">{analytics.averageStars.toFixed(1)}</div>
                <div className="stat-card-label">Avg Stars</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#f97316"><path d="M12 2l2.9 6.26L21 9.27l-5 4.87L17.18 21 12 17.77 6.82 21 8 14.14l-5-4.87 6.1-1.01L12 2z"/></svg>
              </div>
              <div className="stat-card-content stat-card-text">
                <div className="stat-card-value">{analytics.mostStarredRepo || 'N/A'}</div>
                <div className="stat-card-label">Most Starred</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="#8b5cf6"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>
              </div>
              <div className="stat-card-content stat-card-text">
                <div className="stat-card-value">{analytics.topLanguage || 'N/A'}</div>
                <div className="stat-card-label">Top Language</div>
              </div>
            </div>
          </div>
        </div>

        {/* Repositories Table */}
        {topRepositories && topRepositories.length > 0 && (
          <div className="section-card">
            <div className="section-header">
              <h3>Top Repositories</h3>
              <span className="section-tag">{topRepositories.length} public repos</span>
            </div>
            <div className="repositories-list">
              {topRepositories.map((repo) => (
                <div key={repo.name} className="repo-item">
                  <div className="repo-header">
                    <h4>
                      <a href={repo.url} target="_blank" rel="noopener noreferrer">
                        {repo.name}
                      </a>
                    </h4>
                    {repo.language && <span className="repo-language">{repo.language}</span>}
                  </div>
                  {repo.description && <p className="repo-description">{repo.description}</p>}
                  <div className="repo-stats">
                    <span className="repo-stat">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#f59e0b"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      {repo.stars?.toLocaleString() || 0}
                    </span>
                    <span className="repo-stat">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#6366f1"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.51.12-3.15 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 0 1 3.02-.41c1.03.01 2.07.14 3.03.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.85.12 3.15.77.85 1.24 1.93 1.24 3.25 0 4.62-2.82 5.65-5.51 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.88-.01 3.27 0 .32.21.7.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/></svg>
                      {repo.forks?.toLocaleString() || 0}
                    </span>
                    <span className="repo-stat">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="#94a3b8"><path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1zm-1 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/></svg>
                      Updated {new Date(repo.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Floating Chat Button */}
      <button
        className={`chat-fab ${chatOpen ? 'active' : ''}`}
        onClick={() => setChatOpen(!chatOpen)}
        aria-label={chatOpen ? 'Close AI chat' : 'Open AI chat'}
        title="Chat with AI Assistant"
      >
        {chatOpen ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
          </svg>
        )}
      </button>

      {/* Chat Drawer */}
      <div className={`chat-drawer ${chatOpen ? 'open' : ''}`}>
        <div className="chat-drawer-header">
          <div className="chat-drawer-title">
            <span className="chat-drawer-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
            </span>
            <span>AI Assistant</span>
          </div>
          <button className="chat-drawer-close" onClick={() => setChatOpen(false)} aria-label="Close chat">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>
        <div className="chat-drawer-body">
          <AIAssistant username={profile.username} compact />
        </div>
      </div>

      {/* Overlay */}
      {chatOpen && <div className="chat-overlay" onClick={() => setChatOpen(false)} />}
    </section>
  );
}
