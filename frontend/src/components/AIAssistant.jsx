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

export default function AIAssistant({ username }) {
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
    <div className="ai-assistant">
      <div className="ai-header">
        <div className="ai-title">
          <span className="ai-icon">🤖</span>
          <div>
            <h3>AI Assistant</h3>
            <p>Ask questions about @{username}'s GitHub profile</p>
          </div>
        </div>
        <span className={`ai-status ${ragAvailable ? 'online' : 'offline'}`}>
          {ragAvailable === null ? 'Checking...' : ragAvailable ? '● RAG Ready' : '● RAG Offline'}
        </span>
      </div>

      {ragAvailable === false && (
        <div className="ai-warning">
          ⚠️ RAG is not configured. Add a free Gemini API key to backend/.env (see RAG_SETUP.md) to enable AI answers.
        </div>
      )}

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="ai-empty">
            <p>💡 Try asking:</p>
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
            <div key={i} className={`ai-message ${msg.role}`}>
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
          ))
        )}
        {loading && (
          <div className="ai-message assistant">
            <div className="ai-message-content ai-typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
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
          {loading ? '...' : 'Ask'}
        </button>
      </form>
    </div>
  );
}