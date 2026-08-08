import { useState, useEffect, useRef } from 'react';
import { askQuestion, getRagStatus } from '../services/api';
import './AIAssistant.css';

// Simple markdown renderer for AI responses
function renderMarkdown(text) {
  if (!text) return '';

  // Escape HTML first (build entities via concatenation to avoid formatter issues)
  let html = text
    .replace(/&/g, '&' + 'amp;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;');

  // Bold: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic: *text*
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');

  // Inline code: `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bullet points: - item
  html = html.replace(/^\s*[-•]\s+(.+)$/gm, '<li>$1</li>');

  // Numbered lists: 1. item
  html = html.replace(/^\s*(\d+)\.\s+(.+)$/gm, '<li>$2</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  // Headings: ## text
  html = html.replace(/^##\s+(.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^###\s+(.+)$/gm, '<h5>$1</h5>');

  // Paragraphs: split on double newlines
  const paragraphs = html.split(/\n\n+/);
  html = paragraphs
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<ul>') || trimmed.startsWith('<h')) return trimmed;
      return `<p>${trimmed}</p>`;
    })
    .join('');

  // Convert remaining single newlines to <br>
  html = html.replace(/\n/g, '<br>');

  return html;
}

export default function AIAssistant({ username, compact = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ragAvailable, setRagAvailable] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkRagStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const checkRagStatus = async () => {
    try {
      const response = await getRagStatus();
      setRagAvailable(response.data.ready);
    } catch (error) {
      setRagAvailable(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await askQuestion(question, username);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error.response?.data?.error || 'Failed to get an answer. Please try again.',
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSource = (msgIndex, sourceIndex) => {
    setExpandedSources((prev) => ({
      ...prev,
      [`${msgIndex}-${sourceIndex}`]: !prev[`${msgIndex}-${sourceIndex}`],
    }));
  };

  const suggestedQuestions = [
    'What is this developer strongest at?',
    'Which project is most popular and why?',
    'Summarize the tech stack',
    'What kind of projects does this developer build?',
  ];

  return (
    <div className={`ai-assistant ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="ai-header">
          <div className="ai-title">
            <span className="ai-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
            </span>
            <div>
              <h3>AI Assistant</h3>
              <p>Ask questions about @{username}'s GitHub profile</p>
            </div>
          </div>
          <span className={`ai-status ${ragAvailable ? 'online' : 'offline'}`}>
            <span className="ai-status-dot"></span>
            {ragAvailable === null ? 'Checking...' : ragAvailable ? 'RAG Ready' : 'RAG Offline'}
          </span>
        </div>
      )}

      {ragAvailable === false && (
        <div className="ai-warning">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
          <span>RAG is not configured. Add a free Gemini API key to backend/.env (see RAG_SETUP.md) to enable AI answers.</span>
        </div>
      )}

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="ai-empty">
            <div className="ai-empty-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
              </svg>
            </div>
            <p className="ai-empty-title">Ask anything about this profile</p>
            <p className="ai-empty-subtitle">Try one of these questions:</p>
            <div className="ai-suggestions">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  className="ai-suggestion"
                  onClick={() => {
                    setInput(q);
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`ai-message ${msg.role} ${msg.error ? 'error' : ''}`}>
              <div className="ai-message-avatar">
                {msg.role === 'user' ? (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
                  </svg>
                )}
              </div>
              <div className="ai-message-body">
                <div
                  className="ai-message-content"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                />
                {msg.sources && msg.sources.length > 0 && (
                  <div className="ai-sources">
                    <span className="ai-sources-label">Referenced from:</span>
                    <div className="ai-source-chips">
                      {msg.sources.map((source, j) => (
                        <button
                          key={j}
                          className={`ai-source-chip ${expandedSources[`${i}-${j}`] ? 'active' : ''}`}
                          onClick={() => toggleSource(i, j)}
                        >
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.05-.02-2.06-3.34.73-4.04-1.61-4.04-1.61-.55-1.4-1.34-1.77-1.34-1.77-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.84 2.83 1.31 3.52 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.4 1.24-3.25-.12-.3-.54-1.51.12-3.15 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 0 1 3.02-.41c1.03.01 2.07.14 3.03.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.64.24 2.85.12 3.15.77.85 1.24 1.93 1.24 3.25 0 4.62-2.82 5.65-5.51 5.95.43.37.81 1.1.81 2.22 0 1.6-.01 2.88-.01 3.27 0 .32.21.7.83.58C20.56 21.8 24 17.3 24 12 24 5.37 18.63 0 12 0z"/>
                          </svg>
                          {source.repo}
                        </button>
                      ))}
                    </div>
                    {msg.sources.map((source, j) => (
                      expandedSources[`${i}-${j}`] && (
                        <div key={j} className="ai-source-text">
                          {source.text}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-avatar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
              </svg>
            </div>
            <div className="ai-message-body">
              <div className="ai-message-content ai-typing">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="ai-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={`Ask about @${username}...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          {loading ? (
            <span className="ai-send-loading">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </span>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          )}
        </button>
      </form>
    </div>
  );
}