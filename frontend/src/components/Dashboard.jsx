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
          <h2>Profile Analysis</h2>
          <div className="header-actions">
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
                <span>📍 {profile.location}</span>
              )}
              {profile.company && (
                <span>🏢 {profile.company}</span>
              )}
              {profile.website && (
                <span>
                  🔗 <a href={profile.website} target="_blank" rel="noopener noreferrer">Website</a>
                </span>
              )}
              {activityMetrics?.lastActivityDate && (
                <span>📅 Last active: {new Date(activityMetrics.lastActivityDate).toLocaleDateString()} ({activityMetrics.daysSinceLastUpdate}d ago)</span>
              )}
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
          <div className="tech-stack-section">
            <h3>Tech Stack Breakdown</h3>
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
        <div className="analytics-grid">
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.totalStars.toLocaleString()}</div>
              <div className="stat-card-label">Total Stars</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🍴</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.totalForks.toLocaleString()}</div>
              <div className="stat-card-label">Total Forks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.repoCount}</div>
              <div className="stat-card-label">Repositories</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.averageStars.toFixed(1)}</div>
              <div className="stat-card-label">Avg Stars</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💾</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.mostStarredRepo || 'N/A'}</div>
              <div className="stat-card-label">Most Starred</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🔧</div>
            <div className="stat-card-content">
              <div className="stat-card-value">{analytics.topLanguage || 'N/A'}</div>
              <div className="stat-card-label">Top Language</div>
            </div>
          </div>
        </div>

        {/* Repositories Table */}
        {topRepositories && topRepositories.length > 0 && (
          <div className="repositories-section">
            <h3>Top Repositories</h3>
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
                    <span>⭐ {repo.stars?.toLocaleString() || 0}</span>
                    <span>🍴 {repo.forks?.toLocaleString() || 0}</span>
                    <span>📅 Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Assistant (RAG) */}
        <AIAssistant username={profile.username} />
      </div>
    </section>
  );
}
