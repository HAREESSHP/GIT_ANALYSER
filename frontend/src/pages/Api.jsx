import React from 'react';
import './PageStyles.css';

export default function Api() {
  return (
    <div className="page-container">
      <h1>API</h1>
      <p>We provide a seamless API so you can integrate our Git Analyser directly into your own applications.</p>
      <div className="api-section">
        <h3>Endpoint</h3>
        <code>POST /api/analyze</code>
        <p>Analyze a GitHub profile effortlessly by providing a username or a GitHub URL.</p>
      </div>
    </div>
  );
}
