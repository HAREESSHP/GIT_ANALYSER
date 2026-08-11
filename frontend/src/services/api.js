import axios from 'axios';

const defaultProductionUrl = 'https://git-analyser-backend.onrender.com';
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_URL = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5000' : defaultProductionUrl);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeProfile = (data) => {
  return api.post('/api/analyze', data);
};

export const getProfile = (username) => {
  return api.get(`/api/profile/${username}`);
};

export const getAllProfiles = (params = {}) => {
  return api.get('/api/profiles', { params });
};

export const refreshProfile = (username) => {
  return api.put(`/api/profile/${username}`);
};

export const deleteProfile = (username) => {
  return api.delete(`/api/profile/${username}`);
};

export const askQuestion = (question, username) => {
  return api.post('/api/ask', { question, username });
};

export const getRagStatus = () => {
  return api.get('/api/rag/status');
};

export default api;
