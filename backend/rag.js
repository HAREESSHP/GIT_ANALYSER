import axios from 'axios';
import dotenv from 'dotenv';
import { RagChunk, Repository } from './db.js';

dotenv.config();

// ============================================================
// RAG MODULE - Supports two modes:
//
// MODE 1: CLOUD (default, recommended) - Google Gemini API
//   - No downloads, no local installs
//   - Free tier (no credit card required)
//   - Uses in-memory vector search (no ChromaDB needed)
//   - Requires: GEMINI_API_KEY (free from aistudio.google.com)
//
// MODE 2: LOCAL - Ollama + ChromaDB
//   - Fully offline, 100% private
//   - Requires: Ollama + ChromaDB installed locally
//   - Set RAG_MODE=local
// ============================================================

const RAG_MODE = process.env.RAG_MODE || 'cloud';

// --- Cloud (Gemini) config ---
const getGeminiApiKey = () => (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
const GEMINI_LLM_MODEL = process.env.GEMINI_LLM_MODEL || 'gemini-1.5-flash';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

// --- Local (Ollama) config ---
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
const LLM_MODEL = process.env.OLLAMA_LLM_MODEL || 'llama3.2';

// --- Vector store (in-memory cache for cloud mode) ---
// Maps username -> array of { id, text, metadata, embedding }
// Persisted to MongoDB (rag_chunks collection) so data survives restarts
const vectorStore = new Map();

// ChromaDB client (only used in local mode)
let chromaClient = null;
let chromaCollection = null;
let initAttempted = false;
let retryTimer = null;

// ============================================================
// INITIALIZATION
// ============================================================

export async function initRag() {
  const ragMode = process.env.RAG_MODE || 'cloud';
  if (ragMode === 'cloud') {
    const key = getGeminiApiKey();
    if (!key || key.startsWith('your_')) {
      console.log('ℹ️ RAG is in cloud mode but GEMINI_API_KEY is not set.');
      console.log('   Get a free key at: https://aistudio.google.com/apikey');
      console.log('   Add it to backend/.env as GEMINI_API_KEY=your_key');
      return false;
    }
    console.log('✅ RAG ready (cloud mode - Google Gemini, free tier).');
    return true;
  }

  // Local mode - ChromaDB
  if (chromaCollection) return true;
  if (initAttempted && !retryTimer) return false;
  initAttempted = true;

  try {
    const { ChromaClient } = await import('chromadb');
    chromaClient = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
    chromaCollection = await chromaClient.getOrCreateCollection({
      name: 'github_insight_chunks',
      metadata: { 'hnsw:space': 'cosine' },
    });
    console.log('✅ ChromaDB connected. RAG is ready (local mode).');
    if (retryTimer) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    return true;
  } catch (error) {
    if (!retryTimer) {
      console.log('ℹ️ RAG is offline (ChromaDB not running). AI Assistant will be disabled.');
      console.log('   Start ChromaDB with: chroma run --path ./chroma-data --port 8000');
      console.log('   Or switch to cloud mode: set RAG_MODE=cloud and GEMINI_API_KEY in .env');
    }
    if (!retryTimer) {
      retryTimer = setInterval(async () => {
        try {
          const { ChromaClient } = await import('chromadb');
          chromaClient = new ChromaClient({ path: process.env.CHROMA_URL || 'http://localhost:8000' });
          chromaCollection = await chromaClient.getOrCreateCollection({
            name: 'github_insight_chunks',
            metadata: { 'hnsw:space': 'cosine' },
          });
          console.log('✅ ChromaDB connected. RAG is ready (local mode).');
          clearInterval(retryTimer);
          retryTimer = null;
        } catch {
          // Still offline, keep retrying silently
        }
      }, 30000);
    }
    return false;
  }
}

// ============================================================
// EMBEDDINGS
// ============================================================

// Generate embeddings (works in both modes)
async function embed(texts) {
  if (RAG_MODE === 'cloud') {
    return await embedGemini(texts);
  }
  return await embedOllama(texts);
}

// Google Gemini embeddings (free tier)
async function embedGemini(texts) {
  const embedModels = [GEMINI_EMBED_MODEL, 'text-embedding-004', 'embedding-001'].filter((v, i, a) => a.indexOf(v) === i);
  let lastError = null;

  for (const model of embedModels) {
    try {
      if (texts.length === 1) {
        const response = await axios.post(
          `${GEMINI_API_URL}/models/${model}:embedContent?key=${getGeminiApiKey()}`,
          {
            model: `models/${model}`,
            content: { parts: [{ text: texts[0] }] },
          }
        );
        return [response.data.embedding.values];
      }

      const response = await axios.post(
        `${GEMINI_API_URL}/models/${model}:batchEmbedContents?key=${getGeminiApiKey()}`,
        {
          model: `models/${model}`,
          requests: texts.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          })),
        }
      );
      return response.data.embeddings.map((e) => e.values);
    } catch (err) {
      lastError = err;
      console.warn(`Gemini embedding with ${model} failed (${err.message}), trying fallback...`);
    }
  }

  throw new Error(lastError?.response?.data?.error?.message || lastError?.message || 'Failed to generate embeddings');
}

// Ollama embeddings (local)
async function embedOllama(texts) {
  const response = await axios.post(`${OLLAMA_URL}/api/embed`, {
    model: EMBED_MODEL,
    input: texts,
  });
  return response.data.embeddings;
}

// Generate a single embedding
async function embedOne(text) {
  const [embedding] = await embed([text]);
  return embedding;
}

// ============================================================
// CHUNKING
// ============================================================

function chunkRepositories(username, repos, repoContents = {}) {
  const chunks = [];

  // Profile-level summary chunk
  const profileSummary = repos
    .slice(0, 20)
    .map((r) => `${r.name}: ${r.description || 'no description'} (${r.language || 'unknown'}, ${r.stargazers_count || 0} stars, ${r.forks_count || 0} forks)`)
    .join('\n');

  chunks.push({
    id: `${username}_overview`,
    text: `GitHub profile overview for ${username}:\n${profileSummary}`,
    metadata: { username, type: 'overview' },
  });

  // Per-repo chunks
  repos.forEach((repo, i) => {
    const content = repoContents[repo.name] || { readme: null, files: [] };

    const text = [
      `Repository: ${repo.name}`,
      `Owner: ${username}`,
      `Description: ${repo.description || 'No description provided'}`,
      `Language: ${repo.language || 'Not specified'}`,
      `Stars: ${repo.stargazers_count || 0}`,
      `Forks: ${repo.forks_count || 0}`,
      `URL: ${repo.html_url}`,
      `Last updated: ${repo.updated_at || 'Unknown'}`,
    ].join('\n');

    chunks.push({
      id: `${username}_repo_${i}`,
      text,
      metadata: { username, type: 'repo', repo: repo.name },
    });

    // Add README chunk if available
    if (content.readme) {
      chunks.push({
        id: `${username}_readme_${i}`,
        text: `README for repository ${repo.name}:\n${content.readme}`,
        metadata: { username, type: 'readme', repo: repo.name },
      });
    }

    // Add source file chunks
    if (content.files && content.files.length > 0) {
      content.files.forEach((file, j) => {
        chunks.push({
          id: `${username}_file_${i}_${j}`,
          text: `File ${file.name} in repository ${repo.name}:\n${file.content}`,
          metadata: { username, type: 'file', repo: repo.name, file: file.name },
        });
      });
    }
  });

  return chunks;
}

// ============================================================
// INDEXING
// ============================================================

export async function indexUserRepos(username, repos, repoContents = {}) {
  const ok = await initRag();
  if (!ok) return { success: false, error: 'RAG not available' };

  const chunks = chunkRepositories(username, repos, repoContents);
  if (chunks.length === 0) return { success: true, indexed: 0 };

  if (RAG_MODE === 'cloud') {
    // Try to reuse existing embeddings to avoid re-embedding unchanged chunks.
    // 1) Load existing chunks from DB for this user
    let existing = [];
    try {
      existing = await RagChunk.find({ username });
    } catch (err) {
      console.error('Failed to load existing RAG chunks from MongoDB:', err.message);
    }

    const existingMap = new Map();
    existing.forEach((e) => existingMap.set(e.id, e));

    // 2) Determine which texts need new embeddings
    const textsToEmbed = [];
    const embedIndexMap = []; // map from embed result index to chunk index

    const stored = await Promise.all(
      chunks.map(async (c, i) => {
        const found = existingMap.get(c.id);
        if (found && found.text === c.text && found.embedding && found.embedding.length > 0) {
          return { ...c, embedding: found.embedding };
        }
        // mark for embedding later
        embedIndexMap.push(i);
        textsToEmbed.push(c.text);
        return { ...c, embedding: null };
      })
    );

    // 3) Embed only the new/changed texts
    if (textsToEmbed.length > 0) {
      try {
        const newEmbeddings = await embed(textsToEmbed);
        newEmbeddings.forEach((emb, k) => {
          const chunkIdx = embedIndexMap[k];
          if (typeof chunkIdx === 'number') stored[chunkIdx].embedding = emb;
        });
      } catch (err) {
        console.error('Embedding failed during indexing:', err.message);
        // Fallback: remove any partially embedded chunks
        for (const idx of embedIndexMap) stored[idx].embedding = null;
      }
    }

    // 4) Update in-memory cache
    const filteredStored = stored.filter((s) => s.embedding && s.embedding.length > 0);
    vectorStore.set(username, filteredStored);

    // 5) Persist to MongoDB using bulk upserts to avoid full deletes/inserts
    try {
      const ops = stored.map((c) => ({
        updateOne: {
          filter: { username, id: c.id },
          update: {
            $set: {
              username,
              id: c.id,
              text: c.text,
              metadata: c.metadata,
              embedding: c.embedding,
            },
          },
          upsert: true,
        },
      }));
      if (ops.length > 0) await RagChunk.bulkWrite(ops);
    } catch (err) {
      console.error('Failed to persist RAG chunks to MongoDB (bulk upsert):', err.message);
    }

    return { success: true, indexed: filteredStored.length };
  }

  // Local mode - ChromaDB
  if (!chromaCollection) return { success: false, error: 'Vector DB not available' };

  await chromaCollection.delete({ where: { username } }).catch(() => {});

  const ids = chunks.map((c) => c.id);
  const documents = chunks.map((c) => c.text);
  const metadatas = chunks.map((c) => c.metadata);
  const embeddings = await embed(documents);

  await chromaCollection.add({ ids, documents, metadatas, embeddings });

  return { success: true, indexed: chunks.length };
}

// ============================================================
// RETRIEVAL (semantic search)
// ============================================================

// Cosine similarity between two vectors
function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function retrieveChunks(question, username, topK = 5) {
  const ok = await initRag();
  if (!ok) return [];

  if (RAG_MODE === 'cloud') {
    // Check in-memory cache first
    let stored = vectorStore.get(username);

    // If not in memory, load from MongoDB (persisted data)
    if (!stored || stored.length === 0) {
      try {
        const chunks = await RagChunk.find({ username });
        if (chunks.length > 0) {
          stored = chunks.map((c) => ({
            id: c.id,
            text: c.text,
            metadata: c.metadata,
            embedding: c.embedding,
          }));
          vectorStore.set(username, stored);
        }
      } catch (err) {
        console.error('Failed to load RAG chunks from MongoDB:', err.message);
      }
    }

    if (!stored || stored.length === 0) return [];

    const queryEmbedding = await embedOne(question);

    const scored = stored.map((chunk) => ({
      ...chunk,
      distance: 1 - cosineSimilarity(queryEmbedding, chunk.embedding),
    }));

    scored.sort((a, b) => a.distance - b.distance);

    return scored.slice(0, topK).map(({ text, metadata, distance }) => ({
      text,
      metadata,
      distance,
    }));
  }

  // Local mode - ChromaDB
  if (!chromaCollection) return [];

  const queryEmbedding = await embedOne(question);

  const results = await chromaCollection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
    where: { username },
  });

  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  const distances = results.distances?.[0] || [];

  return documents.map((doc, i) => ({
    text: doc,
    metadata: metadatas[i] || {},
    distance: distances[i] || 0,
  }));
}

// ============================================================
// GENERATION
// ============================================================

async function generateAnswer(question, contextChunks) {
  const context = contextChunks
    .map((c, i) => `[Source ${i + 1}]\n${c.text}`)
    .join('\n\n');

  const systemPrompt = `You are a helpful AI assistant for a GitHub analytics dashboard. Answer the user's question based ONLY on the provided context about the GitHub profile.

FORMATTING RULES (very important):
1. Write your answer in a clear, natural, conversational style like ChatGPT.
2. Use Markdown formatting: use **bold** for key terms, bullet points (- ) for lists, and short paragraphs.
3. Structure your answer with a brief intro, then the main points, then a short conclusion if helpful.
4. Do NOT mention "Source 1", "Source 2" etc. in the answer text. Instead, naturally reference the repository names (e.g. "The MINIPROJECT repo...").
5. Keep it concise but informative - 2-5 short paragraphs or a few bullet points.
6. If the context doesn't contain the answer, say "I don't have enough information about that from this profile's repositories."`;

  // Stronger instruction: always finish with one short concluding sentence summarizing the answer.
  // This reduces omitted conclusions; an extra local check will append one if the LLM still omits it.
  const enhancedSystemPrompt = systemPrompt.replace('\n 6. If the context', '\n 6. If the context') + '\n\nIMPORTANT: Always end your answer with one short concluding sentence (one line) that summarizes the main point of the answer.';

  if (RAG_MODE === 'cloud') {
    return await generateGemini(enhancedSystemPrompt, context, question);
  }
  return await generateOllama(enhancedSystemPrompt, context, question);
}

// Ensure the final answer contains a one-line conclusion. If missing, request a single-sentence conclusion
// from the model and append it. This adds one extra LLM call only when needed.
async function ensureConclusion(answerText) {
  try {
    const conclRegex = /(in conclusion|to summarize|in short|summary:|conclusion:|overall:)/i;
    if (conclRegex.test(answerText)) return answerText;

    const sys = 'You are a concise assistant. Produce ONE short concluding sentence (no extra text) that summarizes the provided answer.';
    const followupQuestion = 'Please write a single concise concluding sentence summarizing the answer above. Output ONLY the sentence.';

    let concl = '';
    if (RAG_MODE === 'cloud') {
      concl = await generateGemini(sys, answerText, followupQuestion);
    } else {
      concl = await generateOllama(sys, answerText, followupQuestion);
    }

    concl = (concl || '').trim().split('\n')[0];
    if (!concl) return answerText;
    return answerText.trim() + '\n\nConclusion: ' + concl.replace(/\s+/g, ' ').trim();
  } catch (err) {
    console.error('ensureConclusion failed:', err.message);
    return answerText;
  }
}

// Google Gemini generation (free tier)
async function generateGemini(systemPrompt, context, question) {
  const modelsToTry = [GEMINI_LLM_MODEL, 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'].filter((v, i, a) => a.indexOf(v) === i);
  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const response = await axios.post(
        `${GEMINI_API_URL}/models/${model}:generateContent?key=${getGeminiApiKey()}`,
        {
          contents: [
            {
              role: 'user',
              parts: [
                { text: `System: ${systemPrompt}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:` },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }
      );

      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text;
    } catch (err) {
      lastError = err;
      console.warn(`Gemini generation with ${model} failed (${err.message}), trying fallback...`);
    }
  }

  throw new Error(lastError?.response?.data?.error?.message || lastError?.message || 'Failed to generate answer with Gemini API');
}

// Ollama generation (local)
async function generateOllama(systemPrompt, context, question) {
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: LLM_MODEL,
    prompt: `Context:\n${context}\n\nQuestion: ${question}\n\nAnswer:`,
    system: systemPrompt,
    stream: false,
    options: {
      temperature: 0.3,
      num_ctx: 4096,
    },
  });

  return response.data.response;
}

// ============================================================
// FULL RAG PIPELINE
// ============================================================

export async function askRag(question, username) {
  let chunks = await retrieveChunks(question, username);

  // Auto-index from stored repos if no chunks found
  if (chunks.length === 0) {
    try {
      const storedRepos = await Repository.find({ profile_username: username })
        .sort({ stars: -1 })
        .limit(20);

      if (storedRepos.length > 0) {
        const repos = storedRepos.map((r) => ({
          name: r.repo_name,
          description: r.description,
          language: r.language,
          stargazers_count: r.stars,
          forks_count: r.forks,
          html_url: r.repo_url,
          updated_at: r.updated_at,
        }));
        await indexUserRepos(username, repos);
        chunks = await retrieveChunks(question, username);
      }
    } catch (err) {
      console.error('Auto-index failed:', err.message);
    }
  }

  if (chunks.length === 0) {
    return {
      answer: 'No indexed data found for this profile. Please analyze the profile first so its repositories can be indexed.',
      sources: [],
    };
  }

  let answer = await generateAnswer(question, chunks);

  // Ensure a short concluding sentence is present; append one if the model omitted it.
  answer = await ensureConclusion(answer);

  return {
    answer,
    sources: chunks.map((c) => ({
      repo: c.metadata.repo || c.metadata.type,
      text: c.text,
    })),
  };
}
